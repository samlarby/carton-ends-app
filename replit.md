# Carton and Packing List App

## Overview
A static HTML/CSS/JavaScript web application for managing carton labels and packing lists. This app helps generate and print carton labels with supplier information, PO numbers, quantities, and other shipping details.

## Project Structure
```
.
├── index.html                    # Main page - Create carton ends manually
├── carton-counter.html           # Carton counter page
├── create-carton-ends-from-pl.html # Create labels from count
├── packing-list-creator.html     # Packing list creator
└── assets/
    ├── css/                      # Stylesheets
    └── js/                       # JavaScript files
```

## Technologies
- Pure HTML5, CSS3, JavaScript (no build tools required)
- External libraries loaded via CDN:
  - jsPDF for PDF export
  - html2canvas for PDF generation

## Running Locally
The app is served using Python's built-in HTTP server:
```bash
python -m http.server 5000 --bind 0.0.0.0
```

## Deployment
Static file deployment - serves all files from root directory.
