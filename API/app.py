from flask import Flask, request, jsonify, send_file, render_template, send_from_directory
from flask_cors import CORS
from auth import auth_bp, verify_token # Assuming auth.py contains auth_bp and verify_token
from audio_processor import AudioProcessor # Ensure AudioProcessor is the updated version
from dotenv import load_dotenv
import os
import uuid
import logging
import time
from pymongo import MongoClient
from bson.objectid import ObjectId # Import ObjectId for MongoDB queries

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
    Receives the complete audio file and associates it with a session.
    The audio is saved temporarily.
    """
    try:
        # Get user_id from JWT token and authenticate
        user_id = get_user_id_from_request()
        if not user_id:
            logger.warning("Attempted upload without authentication or invalid token.")
            return jsonify({'error': 'User not authenticated or invalid token'}), 401

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
        # The client now sends 'final_audio.m4a' as the filename
        filename = audio_file.filename 
        logger.info(f"Upload received - Session: {session_id}, Content-Type: {content_type}, Filename: {filename}")

        # Save the final audio file using the updated AudioProcessor method
        saved_path = audio_processor.save_final_audio(
            audio_data, 
            session_id, 
            filename=filename # Use the filename provided by the client (e.g., 'final_audio.m4a')
        )
        logger.info(f"Final audio saved successfully for session {session_id} at: {saved_path}")

        # Save information to MongoDB
        try:
            final_audios_collection.insert_one({ # Insert into the new collection
                "session_id": session_id,
                "user_id": user_id,
                "filename": filename, # This will be 'final_audio.m4a'
                "content_type": content_type,
                "saved_path": saved_path, # Path to the M4A file
                "processed_path": None, # Will be updated after processing to WAV
                "status": "uploaded", # Initial status
                "created_at": time.time()
            })
            logger.info(f"Final audio info for session {session_id} saved to MongoDB.")
        except Exception as mongo_err:
            logger.error(f"Error saving final audio info to MongoDB: {str(mongo_err)}", exc_info=True)
            # Do not return 500 error to the client if file upload was successful but MongoDB failed.
            # Just log the error.

        response_data = {
            "session_id": session_id,
            "message": "Final audio uploaded successfully"
        }
        logger.info(f"Upload response: {response_data}")
        return jsonify(response_data), 200

    except Exception as e:
        logger.error(f"Unexpected error in /upload endpoint: {str(e)}", exc_info=True)
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500

@app.route('/process/<session_id>', methods=['POST'])
def process_audio(session_id):
    """
    Endpoint to process the final audio file of a session.
    Converts the M4A audio to WAV.
    """
    try:
        # Authentication
        user_id = get_user_id_from_request()
        if not user_id:
            logger.warning(f"Attempted to process session {session_id} without authentication or invalid token.")
            return jsonify({'error': 'User not authenticated or invalid token'}), 401

        # Check if the session exists and has an uploaded audio
        if session_id not in active_sessions or not active_sessions[session_id].get("uploaded_final_audio"):
            logger.warning(f"Session {session_id} not found in active sessions or final audio not uploaded for processing.")
            # Also check MongoDB as a fallback
            mongo_doc = final_audios_collection.find_one({"session_id": session_id, "user_id": user_id, "status": "uploaded"})
            if not mongo_doc:
                return jsonify({
                    "status": "error",
                    "message": "Session not found or final audio not uploaded/ready for processing",
                    "session_id": session_id
                }), 404
            # If found in MongoDB but not active_sessions (e.g., server restart), add to active_sessions
            if session_id not in active_sessions:
                 active_sessions[session_id] = {"uploaded_final_audio": True}
                 # Also populate audio_processor's session_data for processing
                 audio_processor.session_data[session_id] = {
                     'final_m4a_path': mongo_doc['saved_path'],
                     'status': 'uploaded'
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
            final_audios_collection.update_one(
                {"session_id": session_id, "user_id": user_id},
                {"$set": {"processed_path": result['output_path'], "status": "processed"}}
            )
            logger.info(f"MongoDB updated with processed path for session {session_id}.")
        except Exception as mongo_update_err:
            logger.error(f"Error updating MongoDB with processed path: {str(mongo_update_err)}", exc_info=True)
            # Log the error, but don't fail the request if processing was successful

        # Clean up session resources after successful processing
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
    Serves the final WAV file.
    """
    try:
        # Authentication is optional for serving files, but good practice if files are user-specific
        user_id = get_user_id_from_request()
        if not user_id:
            logger.warning(f"Attempted to retrieve audio for session {session_id} without authentication or invalid token.")
            # Decide if you want to allow unauthenticated access to processed files or return 401
            # For now, let's allow it if the file exists, but log the warning.
            # If you want strict authentication, uncomment the return below:
            # return jsonify({'error': 'User not authenticated or invalid token'}), 401

        # The AudioProcessor saves the final file as 'final_processed_{session_id}.wav'
        filename = f'final_processed_{session_id}.wav'
        processed_file_path = os.path.join(audio_processor.processed_folder, filename)

        if not os.path.exists(processed_file_path):
            logger.warning(f"Processed audio file not found for session {session_id} at {processed_file_path}")
            return jsonify({
                "status": "error",
                "message": "Audio file not found or not yet processed",
                "session_id": session_id
            }), 404

        logger.info(f"Serving processed file: {processed_file_path}")
        return send_file(processed_file_path, mimetype='audio/wav')

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
    Useful if the client already knows the final filename (e.g., final_processed_SESSIONID.wav).
    """
    try:
        logger.info(f"Serving processed file: {filename} from directory {audio_processor.processed_folder}")
        return send_from_directory(audio_processor.processed_folder, filename)
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
        # We only want entries that have been successfully processed (have a processed_path)
        user_audios = final_audios_collection.find(
            {"user_id": user_id, "status": "processed", "processed_path": {"$ne": None}}
        ).sort("created_at", -1) # Sort by creation time, newest first

        audio_list = []
        for audio_doc in user_audios:
            session_id = audio_doc.get("session_id")
            # Construct the URL for the processed WAV file
            # Use request.url_root to dynamically get the base URL
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

        processed_file_path = audio_doc.get("processed_path")

        # Delete the file from the filesystem if it exists
        if processed_file_path and os.path.exists(processed_file_path):
            os.remove(processed_file_path)
            logger.info(f"Deleted processed audio file: {processed_file_path}")
        else:
            logger.warning(f"Processed audio file not found on filesystem for session {session_id}: {processed_file_path}")

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


if __name__ == '__main__':
    # In a production environment, use a WSGI server like Gunicorn or uWSGI.
    # debug=True is only for development.
    app.run(host='0.0.0.0', port=5000, debug=True)
