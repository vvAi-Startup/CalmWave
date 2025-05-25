import os
import subprocess
import logging
import shutil
import uuid

logger = logging.getLogger(__name__)

class AudioProcessor:
    def __init__(self):
        self.upload_folder = os.path.join( "uploads") # For initial M4A uploads
        self.temp_wav_folder = os.path.join("temp_wavs") # For WAVs converted from M4A
        # CORRECTED: Ensure processed_output_folder is also under base_dir for consistency
        self.processed_output_folder = os.path.join("processed") # For WAVs received from clear_audio

        # Create directories if they don't exist
        os.makedirs(self.upload_folder, exist_ok=True)
        os.makedirs(self.temp_wav_folder, exist_ok=True)
        os.makedirs(self.processed_output_folder, exist_ok=True)

        self.session_data = {} # Stores temporary session-related file paths (in-memory cache)

    def save_final_audio(self, audio_data, session_id, filename="audio.m4a"):
        """
        Saves the final uploaded audio (M4A) to the upload folder.
        """
        session_upload_dir = os.path.join(self.upload_folder, session_id)
        os.makedirs(session_upload_dir, exist_ok=True)
        
        # Ensure filename has .m4a extension
        if not filename.lower().endswith('.m4a'):
            filename = f"{os.path.splitext(filename)[0]}.m4a"

        m4a_path = os.path.join(session_upload_dir, filename)
        try:
            with open(m4a_path, 'wb') as f:
                f.write(audio_data)
            # Store initial path and status in in-memory session data
            self.session_data[session_id] = {'final_m4a_path': m4a_path, 'status': 'uploaded'}
            logger.info(f"Final M4A audio saved for session {session_id} at: {m4a_path}")
            return m4a_path
        except Exception as e:
            logger.error(f"Error saving final M4A audio for session {session_id}: {e}", exc_info=True)
            raise

    def process_session(self, session_id):
        """
        Converts the M4A audio of a session to WAV format.
        The WAV file is saved in the temp_wav_folder.
        """
        if session_id not in self.session_data or 'final_m4a_path' not in self.session_data[session_id]:
            logger.error(f"No M4A audio found in session_data for processing session {session_id}.")
            return {"status": "error", "message": "No M4A audio found for this session to process."}

        m4a_path = self.session_data[session_id]['final_m4a_path']
        
        # Define output WAV path in the new temp_wav_folder
        wav_filename = f"converted_{session_id}.wav"
        wav_path = os.path.join(self.temp_wav_folder, wav_filename)

        try:
            # Use ffmpeg to convert M4A to WAV
            command = [
                'ffmpeg',
                '-i', m4a_path,
                '-acodec', 'pcm_s16le', # PCM signed 16-bit little-endian
                '-ar', '44100',         # 44.1 kHz sample rate
                '-ac', '1',             # Mono audio
                wav_path
            ]
            subprocess.run(command, check=True, capture_output=True)
            
            self.session_data[session_id]['processed_wav_path'] = wav_path
            self.session_data[session_id]['status'] = 'processed'
            logger.info(f"Audio for session {session_id} converted to WAV at: {wav_path}")
            return {"status": "success", "output_path": wav_path}
        except subprocess.CalledProcessError as e:
            logger.error(f"FFmpeg conversion error for session {session_id}: {e.stderr.decode()}", exc_info=True)
            return {"status": "error", "message": f"FFmpeg conversion failed: {e.stderr.decode()}"}
        except Exception as e:
            logger.error(f"Unexpected error during audio processing for session {session_id}: {e}", exc_info=True)
            return {"status": "error", "message": f"Internal processing error: {e}"}

    def cleanup(self, session_id, cleanup_m4a=False, cleanup_temp_wav=False):
        """
        Cleans up temporary files for a given session based on flags.
        Does NOT remove session data from in-memory cache.
        """
        # Clean up M4A upload directory
        if cleanup_m4a:
            m4a_dir = os.path.join(self.upload_folder, session_id)
            if os.path.exists(m4a_dir):
                try:
                    shutil.rmtree(m4a_dir)
                    logger.info(f"Cleaned up M4A upload directory for session {session_id}: {m4a_dir}")
                except OSError as e:
                    logger.warning(f"Could not remove M4A upload directory {m4a_dir}: {e}")
            else:
                logger.debug(f"M4A upload directory not found for session {session_id}: {m4a_dir}")

        # Clean up temporary WAV file
        if cleanup_temp_wav:
            # Get the path from session_data if available, or construct it
            temp_wav_file = self.session_data.get(session_id, {}).get('processed_wav_path')
            if not temp_wav_file:
                # Fallback: construct path if not in session_data (e.g., if app restarted)
                temp_wav_file = os.path.join(self.temp_wav_folder, f"converted_{session_id}.wav")

            if os.path.exists(temp_wav_file):
                try:
                    os.remove(temp_wav_file)
                    logger.info(f"Cleaned up temporary WAV file for session {session_id}: {temp_wav_file}")
                except OSError as e:
                    logger.warning(f"Could not remove temporary WAV file {temp_wav_file}: {e}")
            else:
                logger.debug(f"Temporary WAV file not found for session {session_id}: {temp_wav_file}")
    
    def remove_session_data(self, session_id):
        """
        Removes session-specific data from the in-memory cache.
        This should be called when the session's processing is fully complete
        and its data is persisted in the database.
        """
        if session_id in self.session_data:
            del self.session_data[session_id]
            logger.info(f"Session data for {session_id} removed from in-memory cache.")
        else:
            logger.debug(f"No session data found for {session_id} to remove from in-memory cache.")

    def save_processed_audio_from_external(self, audio_data, filename):
        """
        Saves an audio file received from an external microservice (e.g., denoised audio).
        This file is saved directly into the processed_output_folder.
        """
        # Ensure the processed_output_folder exists
        os.makedirs(self.processed_output_folder, exist_ok=True)
        
        save_path = os.path.join(self.processed_output_folder, filename)
        try:
            with open(save_path, 'wb') as f:
                f.write(audio_data)
            logger.info(f"External processed audio saved to: {save_path}")
            return save_path
        except Exception as e:
            logger.error(f"Error saving external processed audio to {save_path}: {e}", exc_info=True)
            raise