# SmartAudit - TDS Document Extraction & Mapping

A modern, full-stack document extraction system for TDS audit that handles both digital and scanned documents. Upload files via a beautiful web interface and get structured data extracted automatically.

## ✨ Features

- 📄 **Multi-Format Support**: PDF, DOCX, Excel, Images, ZIP archives
- 🤖 **Smart Detection**: Automatically detects digital vs scanned documents
- 🔍 **OCR Processing**: PaddleOCR for scanned documents and images
- 📊 **Table Extraction**: Advanced table detection using Camelot
- 🎨 **Modern UI**: Premium design with glassmorphism and smooth animations
- 🚀 **Fast API**: Built with FastAPI for high performance
- 📱 **Responsive**: Works on desktop, tablet, and mobile

## 🛠️ Installation

### Prerequisites

- Python 3.8 or higher
- pip (Python package manager)

### Setup

1. **Clone or navigate to the project directory**:
```bash
cd m:\smartaudit
```

2. **Create a virtual environment** (recommended):
```bash
python -m venv venv
```

3. **Activate the virtual environment**:
```bash
# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

4. **Install dependencies**:
```bash
pip install -r requirements.txt
```

## 🚀 Running the Application

1. **Start the server**:
```bash
python api.py
```

2. **Open your browser** and navigate to:
```
http://localhost:8000
```

3. **Upload documents** and view extracted data!

## 📖 API Documentation

Once the server is running, access the interactive API documentation at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### API Endpoints

#### Upload Single File
```http
POST /api/upload
Content-Type: multipart/form-data

file: <your-file>
```

#### Upload Multiple Files
```http
POST /api/upload-multiple
Content-Type: multipart/form-data

files: <file1>
files: <file2>
...
```

#### Health Check
```http
GET /health
```

## 📁 Supported File Formats

- **PDF**: Digital and scanned PDFs
- **Word**: .docx, .doc
- **Excel**: .xlsx, .xls
- **Images**: .png, .jpg, .jpeg, .bmp, .tiff
- **Archives**: .zip (containing any of the above)

## 🎯 How It Works

### Digital Documents
1. Upload file via frontend
2. Backend detects format (PDF, DOCX, Excel)
3. Extracts text and tables directly
4. Returns structured JSON data
5. Frontend displays extracted information

### Scanned Documents
1. Upload scanned PDF or image
2. Backend preprocesses the image
3. Applies OCR using PaddleOCR
4. Extracts text and attempts table detection
5. Returns structured data with confidence scores

## 📊 Extracted Data Structure

```json
{
  "status": "success",
  "file_name": "document.pdf",
  "file_type": "pdf",
  "total_documents": 1,
  "documents": [
    {
      "file_name": "document.pdf",
      "pdf_type": "digital",
      "total_pages": 2,
      "pages": [
        {
          "page_no": 1,
          "text": "Extracted text content...",
          "tables": [
            [
              ["Header 1", "Header 2"],
              ["Data 1", "Data 2"]
            ]
          ]
        }
      ]
    }
  ]
}
```

## 🎨 UI Features

- **Drag & Drop**: Simply drag files onto the upload zone
- **Multi-File Upload**: Upload multiple files at once
- **Real-time Progress**: See extraction progress in real-time
- **Beautiful Display**: Extracted data shown in organized cards
- **Table Rendering**: Tables displayed in clean, readable format
- **Dark Theme**: Easy on the eyes with modern dark design

## 🔧 Technology Stack

### Backend
- **FastAPI**: Modern, fast web framework
- **PyMuPDF**: PDF text extraction
- **Camelot**: Table extraction from PDFs
- **PaddleOCR**: OCR for scanned documents
- **python-docx**: Word document processing
- **pandas/openpyxl**: Excel file handling

### Frontend
- **HTML5**: Semantic markup
- **CSS3**: Modern styling with gradients and animations
- **Vanilla JavaScript**: No framework dependencies
- **Inter Font**: Clean, professional typography

## 📝 Project Structure

```
smartaudit/
├── api.py                      # FastAPI backend
├── tds_challan_extractor.py   # Core extraction logic
├── requirements.txt            # Python dependencies
├── frontend/
│   ├── index.html             # Main HTML
│   ├── styles.css             # Premium CSS
│   └── app.js                 # Interactive JavaScript
├── input.zip                   # Sample input files
└── extracted_data.json         # Sample output
```

## 🐛 Troubleshooting

### OCR Not Working
If PaddleOCR fails to initialize:
- Ensure you have sufficient disk space
- Check internet connection for model downloads
- Try reinstalling: `pip install paddleocr --force-reinstall`

### Port Already in Use
If port 8000 is busy:
```bash
# Change port in api.py (last line)
uvicorn.run(app, host="0.0.0.0", port=8001)
```

### File Upload Fails
- Check file size (default limit: 100MB)
- Verify file format is supported
- Check server logs for detailed error messages

## 📄 License

This project is for TDS audit document processing.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## 📧 Support

For issues or questions, please check the server logs or API documentation.

---

**Made with ❤️ for efficient TDS auditing**
