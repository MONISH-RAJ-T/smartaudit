from tds_challan_extractor import process_zip
# from advanced_examples import extract_tables_to_csv, generate_extraction_statistics
import json

# Extract
data = process_zip("input.zip")

# Analyze
# stats = generate_extraction_statistics(data)
stats = {"status": "success", "extracted_documents": len(data) if data else 0}

# Export tables
# extract_tables_to_csv(data, "tables_output")

# Save stats
with open("stats.json", "w") as f:
    json.dump(stats, f, indent=2)
