import os
from flask import Flask, request, redirect, url_for, render_template, send_from_directory, flash
import qrcode
from PIL import Image
import requests
import time

UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = set(['txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'zip', 'rar', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'csv', 'mp3', 'mp4', 'avi', 'mkv'])

LOGO_URL = 'https://cdn-icons-png.flaticon.com/512/9153/9153957.png'
LOGO_PATH = os.path.join(UPLOAD_FOLDER, 'qr_logo.png')

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.secret_key = 'supersecretkey'

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# Download logo if not exists
if not os.path.exists(LOGO_PATH):
    r = requests.get(LOGO_URL)
    if r.status_code == 200:
        with open(LOGO_PATH, 'wb') as f:
            f.write(r.content)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def delete_old_files(folder, hours=48):
    now = time.time()
    cutoff = now - hours * 3600
    for filename in os.listdir(folder):
        filepath = os.path.join(folder, filename)
        if os.path.isfile(filepath):
            if os.path.getmtime(filepath) < cutoff:
                try:
                    os.remove(filepath)
                except Exception:
                    pass

@app.route('/', methods=['GET', 'POST'])
def index():
    # Delete files older than 48 hours
    delete_old_files(app.config['UPLOAD_FOLDER'], hours=48)
    if request.method == 'POST':
        if 'file' not in request.files:
            flash('No file part')
            return redirect(request.url)
        file = request.files['file']
        if file.filename == '':
            flash('No selected file')
            return redirect(request.url)
        if file and allowed_file(file.filename):
            filename = file.filename
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            download_url = url_for('download_file', filename=filename, _external=True)
            # Generate QR code
            qr = qrcode.QRCode(
                error_correction=qrcode.constants.ERROR_CORRECT_H
            )
            qr.add_data(download_url)
            qr.make(fit=True)
            qr_img = qr.make_image(fill_color="black", back_color="white").convert('RGB')
            # Overlay logo at center
            logo = Image.open(LOGO_PATH)
            # Resize logo
            qr_width, qr_height = qr_img.size
            logo_size = int(qr_width * 0.25)
            logo = logo.resize((logo_size, logo_size), Image.LANCZOS)
            # Calculate position
            pos = ((qr_width - logo_size) // 2, (qr_height - logo_size) // 2)
            qr_img.paste(logo, pos, mask=logo if logo.mode == 'RGBA' else None)
            qr_path = os.path.join(app.config['UPLOAD_FOLDER'], filename + '_qr.png')
            qr_img.save(qr_path)
            return render_template('index.html', download_url=download_url, qr_image=filename + '_qr.png')
    return render_template('index.html')

@app.route('/uploads/<filename>')
def download_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename, as_attachment=True)

@app.route('/qr/<qr_image>')
def qr_image(qr_image):
    return send_from_directory(app.config['UPLOAD_FOLDER'], qr_image)

if __name__ == '__main__':
    app.run(debug=True) 