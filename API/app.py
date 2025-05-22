from flask import Flask, request, jsonify, send_file, render_template, send_from_directory
from flask_cors import CORS
import shutil
from auth import auth_bp, verify_token # Assuming auth.py contains auth_bp and verify_token
from audio_processor import AudioProcessor # Ensure AudioProcessor is the updated version
from dotenv import load_dotenv
import os
import uuid
import logging
import time
from pymongo import MongoClient
from bson.objectid import ObjectId # Import ObjectId for MongoDB queries
import requests # Importar a biblioteca requests

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Configure CORS to accept requests from any origin
CORS(app, resources={
    r"/*": {
        "origins": "*",
        "methods": ["GET", "POST", "DELETE", "OPTIONS"], # Added DELETE method
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

app.register_blueprint(auth_bp, url_prefix='/auth')

# Initialize audio processor
audio_processor = AudioProcessor()

# Store active sessions (in memory, for basic control)
# Now tracks if a session has a final audio uploaded
active_sessions = {}

# Connect to MongoDB
try:
    mongo_uri = os.getenv('MONGO_URI')
    if not mongo_uri:
        raise ValueError("Environment variable 'MONGO_URI' is not defined.")
    mongo = MongoClient(mongo_uri)
    db = mongo['calmwave']
    final_audios_collection = db['final_audios'] # Renamed collection for clarity
    logger.info("Connected to MongoDB successfully.")
except Exception as e:
    logger.error(f"Error connecting to MongoDB: {str(e)}", exc_info=True)
    # In a production environment, you might want to exit or have a fallback
    # For development, we'll just log the error.

def get_user_id_from_request():
    """
    Extracts the user_id from the JWT token in the request.
    """
    token = request.headers.get('Authorization')
    if not token:
        logger.debug("No authorization token found.")
        return None
    if token.startswith('Bearer '):
        token = token[7:]
    payload = verify_token(token)
    if not payload:
        logger.warning("Invalid or expired JWT token.")
        return None
    return payload.get('user_id')

@app.route('/health')
def health_check():
    """
    Endpoint to check if the API is online.
    """
    return jsonify({'status': 'ok', 'message': 'API is running!'}), 200

@app.route('/upload', methods=['POST'])
def upload_audio():
    """
    Endpoint for uploading the final audio file.
    Receives the complete audio file, saves it, converts it to WAV,
    and then sends the WAV to an external denoising microservice.
    """
    try:
        # Tenta obter user_id do formulário primeiro
        user_id = request.form.get('user_id')
        
        # Se não estiver no formulário, tenta do token JWT (se presente)
        if not user_id:
            user_id = get_user_id_from_request()
        
        # Se user_id ainda for None, atribui um valor padrão
        if not user_id:
            user_id = "anonymous_user" # Ou str(uuid.uuid4()) para um ID único a cada vez
            logger.info(f"No user_id provided or authenticated. Assigning default: {user_id}")

        if 'audio' not in request.files:
            logger.error("No audio file sent in the request.")
            return jsonify({"error": "No audio file sent"}), 400

        audio_file = request.files['audio']
        if not audio_file or audio_file.filename == '':
            logger.error("Empty or nameless audio file.")
            return jsonify({"error": "Empty audio file"}), 400

        # Get session_id from the form
        session_id = request.form.get('session_id')
        logger.info(f"Upload received for session_id: {session_id}")
        
        # If no session_id, create a new session
        if not session_id:
            session_id = str(uuid.uuid4())
            logger.info(f"New session created: {session_id}")
        
        # Mark session as active and having an uploaded file
        active_sessions[session_id] = {"uploaded_final_audio": True}
        logger.info(f"Session {session_id} marked as active with final audio uploaded.")

        # Read audio data
        audio_data = audio_file.read()
        if not audio_data:
            logger.error("Empty audio data after reading the file.")
            return jsonify({"error": "Empty audio data"}), 400

        # Get file information
        content_type = audio_file.content_type
        filename = audio_file.filename 
        logger.info(f"Upload received - Session: {session_id}, Content-Type: {content_type}, Filename: {filename}")

        # Save the final audio file (M4A) using the AudioProcessor method
        saved_m4a_path = audio_processor.save_final_audio(
            audio_data, 
            session_id, 
            filename=filename
        )
        logger.info(f"Final M4A audio saved successfully for session {session_id} at: {saved_m4a_path}")

        # Process the audio (convert M4A to WAV)
        processing_result = audio_processor.process_session(session_id)
        if processing_result["status"] == "error":
            logger.error(f"Error processing audio for session {session_id}: {processing_result['message']}")
            return jsonify({"error": f"Failed to process audio: {processing_result['message']}"}), 500
        
        processed_wav_path = processing_result['output_path']
        logger.info(f"Audio converted to WAV for session {session_id} at: {processed_wav_path}")

        # Send the processed WAV audio to the external microservice
        denoise_service_url = "http://10.67.57.148:8000/audio/denoise" 
        try:
            # Dados adicionais a serem enviados junto com o arquivo
            additional_data = {
                'session_id': session_id,
                'user_id': user_id, # user_id obtido (do formulário, token ou padrão)
                'file_name': os.path.basename(processed_wav_path) # Nome do arquivo WAV
            }

            with open(processed_wav_path, 'rb') as f:
                denoise_response = requests.post(
                    denoise_service_url, 
                    files={'audio': (os.path.basename(processed_wav_path), f.read(), 'audio/wav')},
                    data=additional_data, # Envia os dados adicionais
                    timeout=60 # Adicione um timeout para a requisição
                )
            denoise_response.raise_for_status() # Levanta um erro para códigos de status HTTP 4xx/5xx
            logger.info(f"Audio sent to denoise service successfully. Response: {denoise_response.json()}")
            denoise_status = "sent_for_denoising"
            denoise_message = denoise_response.json().get('message', 'Audio sent to denoise service.')
        except requests.exceptions.RequestException as req_err:
            logger.error(f"Error sending audio to denoise service: {req_err}", exc_info=True)
            denoise_status = "denoise_send_failed"
            denoise_message = f"Failed to send audio for denoising: {req_err}"
            # Decide if you want to return an error to the client here or continue
            # For now, we'll log and continue, but the MongoDB status will reflect failure.
        except Exception as e:
            logger.error(f"Unexpected error during denoise service call: {e}", exc_info=True)
            denoise_status = "denoise_send_failed"
            denoise_message = f"Unexpected error during denoise service call: {e}"

        # Save information to MongoDB
        try:
            final_audios_collection.insert_one({
                "session_id": session_id,
                "user_id": user_id,
                "filename": filename, # This will be 'final_audio.m4a'
                "content_type": content_type,
                "saved_m4a_path": saved_m4a_path, # Path to the M4A file
                "processed_wav_path": processed_wav_path, # Path to the WAV file
                "status": denoise_status, # Status reflecting the denoise sending attempt
                "denoise_message": denoise_message,
                "created_at": time.time()
            })
            logger.info(f"Final audio info for session {session_id} saved to MongoDB with denoise status.")
        except Exception as mongo_err:
            logger.error(f"Error saving final audio info to MongoDB: {str(mongo_err)}", exc_info=True)
            # Do not return 500 error to the client if file upload/processing was successful but MongoDB failed.
            # Just log the error.

        # Clean up session resources (removes M4A, keeps WAV for potential serving by this app)
        try:
            audio_processor.cleanup(session_id)
            logger.info(f"Session {session_id} resources cleaned up after sending to denoise service.")
        except Exception as cleanup_err:
            logger.error(f"Error cleaning up session resources {session_id}: {str(cleanup_err)}", exc_info=True)
            # Cleanup failed, but processing and sending were successful, so we don't return 500 error to the client.
            # Just log the issue.

        # Remove session from the list of active sessions (in memory)
        if session_id in active_sessions:
            del active_sessions[session_id]
            logger.info(f"Session {session_id} removed from active_sessions.")

        response_data = {
            "session_id": session_id,
            "message": "Final audio uploaded, processed, and sent for denoising.",
            "denoise_service_status": denoise_status,
            "denoise_service_message": denoise_message
        }
        logger.info(f"Upload response: {response_data}")
        return jsonify(response_data), 200

    except Exception as e:
        logger.error(f"Unexpected error in /upload endpoint: {str(e)}", exc_info=True)
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500


# Removida a definição duplicada da rota /clear_audio
# @app.route('/clear_audio', methods=['POST'])
# def clear_audio():
#     """
#     Endpoint to receive an audio file from another microservice
#     and save it directly into the converted directory.
#     """
#     try:
#         if 'audio' not in request.files:
#             logger.error("No audio file sent in the /clear_audio request.")
#             return jsonify({"error": "No audio file sent"}), 400

#         audio_file = request.files['audio']
#         if not audio_file or audio_file.filename == '':
#             logger.error("Empty or nameless audio file in /clear_audio request.")
#             return jsonify({"error": "Empty audio file"}), 400

#         # Generate a unique filename for the saved audio
#         unique_filename = f"cleared_audio_{uuid.uuid4().hex}.wav" 
#         # Usar audio_processor.converted_folder
#         save_path = os.path.join(audio_processor.converted_folder, unique_filename)

#         audio_file.save(save_path)
#         logger.info(f"Audio received and saved to converted directory: {save_path}")

#         return jsonify({
#             "status": "success",
#             "message": "Audio successfully saved to converted directory",
#             "filename": unique_filename,
#             "path": f"{request.url_root.rstrip('/')}/processed/{unique_filename}" # Usa /processed para servir
#         }), 200

#     except Exception as e:
#         logger.error(f"Error in /clear_audio endpoint: {str(e)}", exc_info=True)
#         return jsonify({"error": f"Internal server error: {str(e)}"}), 500


@app.route('/process/<session_id>', methods=['POST'])
def process_audio(session_id):
    """
    Endpoint to process the final audio file of a session.
    Converts the M4A audio to WAV.
    NOTE: With the /upload route now handling processing, this route might become redundant
    or serve a different, explicit processing trigger.
    """
    try:
        # Authentication
        user_id = get_user_id_from_request()
        if not user_id:
            logger.warning(f"Attempted to process session {session_id} without authentication or invalid token.")
            return jsonify({'error': 'User not authenticated or invalid token'}), 401

        # Check if the session exists and has an uploaded audio
        # We now also check MongoDB as the primary source of truth if active_sessions is empty
        mongo_doc = final_audios_collection.find_one({"session_id": session_id, "user_id": user_id, "saved_m4a_path": {"$ne": None}})
        if not mongo_doc:
            logger.warning(f"Session {session_id} not found in MongoDB or M4A not uploaded for processing.")
            return jsonify({
                "status": "error",
                "message": "Session not found or M4A audio not uploaded/ready for processing",
                "session_id": session_id
            }), 404
        
        # If found in MongoDB, ensure audio_processor's session_data is populated for processing
        if session_id not in audio_processor.session_data:
            audio_processor.session_data[session_id] = {
                'final_m4a_path': mongo_doc['saved_m4a_path'],
                'status': mongo_doc.get('status', 'uploaded')
            }
            logger.info(f"Session {session_id} re-initialized from MongoDB for processing.")


        logger.info(f"Starting processing for session: {session_id}")
        result = audio_processor.process_session(session_id)
        
        if result["status"] == "error":
            logger.error(f"Error processing session {session_id}: {result['message']}")
            return jsonify(result), 500

        logger.info(f"Session {session_id} processed successfully. Output: {result.get('output_path')}")

        # Update MongoDB with the processed WAV path and status
        try:
            # Usar 'processed_wav_path' para consistência com o que é salvo no /upload
            final_audios_collection.update_one(
                {"session_id": session_id, "user_id": user_id},
                {"$set": {"processed_wav_path": result['output_path'], "status": "processed"}}
            )
            logger.info(f"MongoDB updated with processed path for session {session_id}.")
        except Exception as mongo_update_err:
            logger.error(f"Error updating MongoDB with processed path: {str(mongo_update_err)}", exc_info=True)
            # Log the error, but don't fail the request if processing was successful

        # Clean up session resources after successful processing (removes M4A, keeps WAV)
        try:
            audio_processor.cleanup(session_id)
            logger.info(f"Session {session_id} resources cleaned up after processing.")
        except Exception as cleanup_err:
            logger.error(f"Error cleaning up session resources {session_id}: {str(cleanup_err)}", exc_info=True)
            # Cleanup failed, but processing was successful, so we don't return 500 error to the client.
            # Just log the issue.

        # Remove session from the list of active sessions (in memory)
        if session_id in active_sessions:
            del active_sessions[session_id]
            logger.info(f"Session {session_id} removed from active_sessions.")

        return jsonify(result), 200

    except Exception as e:
        logger.error(f"Unexpected error in /process/{session_id} endpoint: {str(e)}", exc_info=True)
        return jsonify({
            "status": "error",
            "message": f"Internal server error processing audio: {str(e)}",
            "session_id": session_id
        }), 500

@app.route('/audio/<session_id>', methods=['GET'])
def get_audio(session_id):
    """
    Endpoint to retrieve the processed audio of a session.
    Serves the final WAV file from the converted_folder.
    """
    try:
        user_id = get_user_id_from_request()
        if not user_id:
            logger.warning(f"Attempted to retrieve audio for session {session_id} without authentication or invalid token.")
            # For now, let's allow it if the file exists, but log the warning.
            # If you want strict authentication, uncomment the return below:
            # return jsonify({'error': 'User not authenticated or invalid token'}), 401

        # Retrieve the processed_wav_path from MongoDB
        # Usar 'processed_wav_path' para buscar no MongoDB
        audio_doc = final_audios_collection.find_one({"session_id": session_id, "user_id": user_id, "processed_wav_path": {"$ne": None}})
        if not audio_doc:
            logger.warning(f"Processed audio file not found in MongoDB for session {session_id} for user {user_id}.")
            return jsonify({
                "status": "error",
                "message": "Audio file not found or not yet processed",
                "session_id": session_id
            }), 404
        
        processed_file_path = audio_doc['processed_wav_path']

        # Verificar se o arquivo existe no diretório correto (temp_audio)
        # O nome do arquivo no disco é 'converted_{session_id}.wav'
        expected_filename_on_disk = f'converted_{session_id}.wav'
        expected_full_path = os.path.join(audio_processor.converted_folder, expected_filename_on_disk)

        if not os.path.exists(expected_full_path):
            logger.warning(f"Processed audio file not found on filesystem for session {session_id} at {expected_full_path}")
            return jsonify({
                "status": "error",
                "message": "Audio file not found on server or not yet processed",
                "session_id": session_id
            }), 404

        logger.info(f"Serving processed file: {expected_full_path}")
        return send_file(expected_full_path, mimetype='audio/wav')

    except Exception as e:
        logger.error(f"Error retrieving audio for session {session_id}: {str(e)}", exc_info=True)
        return jsonify({
            "status": "error",
            "message": f"Error retrieving audio: {str(e)}",
            "session_id": session_id
        }), 500

@app.route('/processed/<filename>')
def serve_processed_file(filename):
    """
    Endpoint to serve processed files directly by filename.
    Useful if the client already knows the final filename (e.g., converted_SESSIONID.wav).
    """
    try:
        # Usar audio_processor.converted_folder
        logger.info(f"Serving processed file: {filename} from directory {audio_processor.converted_folder}")
        return send_from_directory(audio_processor.converted_folder, filename)
    except Exception as e:
        logger.error(f"Error serving file {filename}: {str(e)}", exc_info=True)
        return jsonify({'error': 'File not found or internal error'}), 404

# NEW ENDPOINT: List processed audios for the authenticated user
@app.route('/audios/list', methods=['GET'])
def list_audios():
    """
    Endpoint to list all processed audio files for the authenticated user.
    """
    try:
        user_id = get_user_id_from_request()
        if not user_id:
            logger.warning("Attempted to list audios without authentication or invalid token.")
            return jsonify({'error': 'User not authenticated or invalid token'}), 401

        # Find all processed audios for this user
        # Usar 'processed_wav_path' e considerar status de denoising
        user_audios = final_audios_collection.find(
            {"user_id": user_id, "processed_wav_path": {"$ne": None},
             "$or": [{"status": "processed"}, {"status": "sent_for_denoising"}]} # Listar se foi processado ou enviado para denoising
        ).sort("created_at", -1) # Sort by creation time, newest first

        audio_list = []
        for audio_doc in user_audios:
            session_id = audio_doc.get("session_id")
            # Construct the URL for the processed WAV file
            base_api_url = request.url_root.rstrip('/') # Remove trailing slash
            audio_url = f"{base_api_url}/audio/{session_id}"

            audio_list.append({
                "id": str(audio_doc["_id"]), # MongoDB ObjectId as string
                "session_id": session_id,
                "title": f"Gravação {time.strftime('%Y-%m-%d %H:%M', time.localtime(audio_doc['created_at']))}",
                "path": audio_url, # The URL to fetch the WAV file
                "created_at": audio_doc["created_at"]
            })
        
        logger.info(f"Returning {len(audio_list)} processed audios for user {user_id}.")
        return jsonify(audio_list), 200

    except Exception as e:
        logger.error(f"Error listing audios for user {user_id}: {str(e)}", exc_info=True)
        return jsonify({'error': f"Internal server error: {str(e)}"}), 500

# NEW ENDPOINT: Delete processed audio
@app.route('/audio/<session_id>', methods=['DELETE'])
def delete_audio(session_id):
    """
    Endpoint to delete a processed audio file and its metadata.
    """
    try:
        user_id = get_user_id_from_request()
        if not user_id:
            logger.warning(f"Attempted to delete audio for session {session_id} without authentication or invalid token.")
            return jsonify({'error': 'User not authenticated or invalid token'}), 401

        # Find the audio document in MongoDB
        audio_doc = final_audios_collection.find_one({"session_id": session_id, "user_id": user_id})

        if not audio_doc:
            logger.warning(f"Audio for session {session_id} not found for user {user_id}.")
            return jsonify({'error': 'Audio not found or you do not have permission to delete it'}), 404

        # Get paths for both M4A (if it still exists) and WAV files
        saved_m4a_path = audio_doc.get("saved_m4a_path")
        # Usar 'processed_wav_path' para o caminho do WAV
        processed_wav_path = audio_doc.get("processed_wav_path")

        # Delete the M4A file from the filesystem if it exists
        if saved_m4a_path and os.path.exists(saved_m4a_path):
            try:
                os.remove(saved_m4a_path)
                logger.info(f"Deleted M4A audio file: {saved_m4a_path}")
            except OSError as e:
                logger.warning(f"Could not delete M4A file {saved_m4a_path}: {e}")
        else:
            logger.warning(f"M4A audio file not found on filesystem for session {session_id}: {saved_m4a_path}")

        # Delete the WAV file from the filesystem if it exists
        if processed_wav_path and os.path.exists(processed_wav_path):
            try:
                os.remove(processed_wav_path)
                logger.info(f"Deleted processed WAV audio file: {processed_wav_path}")
            except OSError as e:
                logger.warning(f"Could not delete WAV file {processed_wav_path}: {e}")
        else:
            logger.warning(f"Processed WAV audio file not found on filesystem for session {session_id}: {processed_wav_path}")

        # Delete the document from MongoDB
        final_audios_collection.delete_one({"session_id": session_id, "user_id": user_id})
        logger.info(f"Deleted audio metadata for session {session_id} from MongoDB.")

        # Also clean up the upload directory if it still exists (should have been cleaned by process_session)
        session_upload_dir = os.path.join(audio_processor.upload_folder, session_id)
        if os.path.exists(session_upload_dir):
            shutil.rmtree(session_upload_dir)
            logger.info(f"Cleaned up upload directory for session {session_id}.")

        return jsonify({'message': 'Audio deleted successfully'}), 200

    except Exception as e:
        logger.error(f"Error deleting audio for session {session_id}: {str(e)}", exc_info=True)
        return jsonify({'error': f"Internal server error: {str(e)}"}), 500

@app.route('/clear_audio', methods=['POST'])
def clear_audio():
    """
    Endpoint to receive an audio file from another microservice
    and save it directly into the converted directory.
    """
    try:
        if 'audio' not in request.files:
            logger.error("No audio file sent in the /clear_audio request.")
            return jsonify({"error": "No audio file sent"}), 400

        audio_file = request.files['audio']
        if not audio_file or audio_file.filename == '':
            logger.error("Empty or nameless audio file in /clear_audio request.")
            return jsonify({"error": "Empty audio file"}), 400

        # Generate a unique filename for the saved audio
        unique_filename = f"cleared_audio_{uuid.uuid4().hex}.wav" 
        # Usar audio_processor.converted_folder
        save_path = os.path.join(audio_processor.converted_folder, unique_filename)

        audio_file.save(save_path)
        logger.info(f"Audio received and saved to converted directory: {save_path}")

        return jsonify({
            "status": "success",
            "message": "Audio successfully saved to converted directory",
            "filename": unique_filename,
            "path": f"{request.url_root.rstrip('/')}/processed/{unique_filename}" # Usa /processed para servir
        }), 200

    except Exception as e:
        logger.error(f"Error in /clear_audio endpoint: {str(e)}", exc_info=True)
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500


if __name__ == '__main__':
    # In a production environment, use a WSGI server like Gunicorn or uWSGI.
    # debug=True is only for development.
    app.run(host='0.0.0.0', port=5000, debug=True)
