FROM python:3.9-slim

# Install system dependencies, including ffmpeg for audio processing
RUN apt-get update && apt-get install -y \
    ffmpeg \
    gcc \
    libpq-dev \
    # Clean up lists to reduce image size
    && rm -rf /var/lib/apt/lists/*

# Set the working directory inside the container
WORKDIR /app

# Copy requirements.txt and install Python dependencies
# This step is cached if requirements.txt doesn't change
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of your application code
COPY . .

# Create the necessary persistent directories
# 'uploads' for original M4A uploads
# 'temp_wavs' for temporary WAV files created during conversion
# 'processed' for final denoised/processed audio files
RUN mkdir -p uploads temp_wavs processed

# Set environment variables for Flask and Python buffering
ENV PYTHONUNBUFFERED=1 \
    FLASK_APP=run.py \
    FLASK_RUN_HOST=0.0.0.0 \
    FLASK_ENV=production

# Expose the port your Flask application will listen on
EXPOSE 5000

# Command to run your Flask application
CMD ["python", "run.py"]