#!/usr/bin/env python3
"""
FastAPI Backend for TDS Document Extraction
Handles file uploads and returns structured extracted data
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse
import os
import tempfile
import shutil
from pathlib import Path
from typing import List, Dict, Any
import logging

from tds_challan_extractor import (
    extract_document,
    extract_zip,
    get_file_type,
    SUPPORTED_FORMATS
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="TDS Document Extraction API",
    description="Extract structured data from TDS documents (PDF, DOCX, Excel, Images)",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for frontend
if os.path.exists("frontend"):
    app.mount("/static", StaticFiles(directory="frontend"), name="static")


@app.get("/")
async def root():
    """Serve the frontend"""
    frontend_path = Path("frontend/index.html")
    if frontend_path.exists():
        return FileResponse(frontend_path)
    return {"message": "TDS Document Extraction API", "docs": "/docs"}


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "TDS Document Extraction API"}


@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    """
    Upload and process a document file
    
    Accepts: PDF, DOCX, Excel, Images, ZIP archives
    Returns: Structured extracted data
    """
    try:
        # Validate file
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file provided")
        
        file_ext = Path(file.filename).suffix.lower()
        logger.info(f"Received file: {file.filename} ({file_ext})")
        
        # Check if supported format
        if file_ext not in SUPPORTED_FORMATS and file_ext != '.zip':
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file format. Supported: {', '.join(SUPPORTED_FORMATS)}, .zip"
            )
        
        # Create temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as tmp_file:
            # Write uploaded file to temp location
            content = await file.read()
            tmp_file.write(content)
            tmp_path = tmp_file.name
        
        try:
            # Process based on file type
            if file_ext == '.zip':
                # Extract zip and process all files
                extracted_files = extract_zip(tmp_path, out_dir="temp_extracted")
                
                if not extracted_files:
                    raise HTTPException(
                        status_code=400,
                        detail="No supported files found in ZIP archive"
                    )
                
                results = []
                for file_path in extracted_files:
                    try:
                        result = extract_document(file_path)
                        if result:
                            results.append(result)
                    except Exception as e:
                        logger.error(f"Error processing {file_path}: {e}")
                        results.append({
                            "file_name": os.path.basename(file_path),
                            "error": str(e),
                            "status": "failed"
                        })
                
                # Cleanup extracted files
                if os.path.exists("temp_extracted"):
                    shutil.rmtree("temp_extracted", ignore_errors=True)
                
                return JSONResponse(content={
                    "status": "success",
                    "file_name": file.filename,
                    "file_type": "zip",
                    "total_documents": len(results),
                    "documents": results
                })
            
            else:
                # Process single file
                result = extract_document(tmp_path)
                
                if not result:
                    raise HTTPException(
                        status_code=500,
                        detail="Failed to extract data from document"
                    )
                
                return JSONResponse(content={
                    "status": "success",
                    "file_name": file.filename,
                    "file_type": get_file_type(tmp_path),
                    "total_documents": 1,
                    "documents": [result]
                })
        
        finally:
            # Cleanup temp file
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


@app.post("/api/upload-multiple")
async def upload_multiple_files(files: List[UploadFile] = File(...)):
    """
    Upload and process multiple document files
    
    Accepts: Multiple files of supported formats
    Returns: Structured extracted data for all files
    """
    try:
        if not files:
            raise HTTPException(status_code=400, detail="No files provided")
        
        results = []
        
        for file in files:
            try:
                file_ext = Path(file.filename).suffix.lower()
                
                if file_ext not in SUPPORTED_FORMATS:
                    results.append({
                        "file_name": file.filename,
                        "error": f"Unsupported format: {file_ext}",
                        "status": "skipped"
                    })
                    continue
                
                # Create temporary file
                with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as tmp_file:
                    content = await file.read()
                    tmp_file.write(content)
                    tmp_path = tmp_file.name
                
                try:
                    result = extract_document(tmp_path)
                    if result:
                        results.append(result)
                    else:
                        results.append({
                            "file_name": file.filename,
                            "error": "Extraction failed",
                            "status": "failed"
                        })
                finally:
                    if os.path.exists(tmp_path):
                        os.unlink(tmp_path)
            
            except Exception as e:
                logger.error(f"Error processing {file.filename}: {e}")
                results.append({
                    "file_name": file.filename,
                    "error": str(e),
                    "status": "failed"
                })
        
        return JSONResponse(content={
            "status": "success",
            "total_files": len(files),
            "total_processed": len([r for r in results if "pages" in r]),
            "documents": results
        })
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    
    logger.info("🚀 Starting TDS Document Extraction API...")
    logger.info("📄 API Documentation: http://localhost:8000/docs")
    logger.info("🌐 Frontend: http://localhost:8000")
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )
