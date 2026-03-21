import zipfile
import xml.etree.ElementTree as ET
import glob
import os

word_schema = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'

def read_docx(path):
    print(f"=== CONTENT OF {os.path.basename(path)} ===")
    try:
        document = zipfile.ZipFile(path)
        xml_content = document.read('word/document.xml')
        document.close()
        tree = ET.XML(xml_content)
        
        paragraphs = []
        for node in tree.iter(f'{{{word_schema}}}p'):
            texts = [t.text for t in node.iter(f'{{{word_schema}}}t') if t.text]
            if texts:
                paragraphs.append(''.join(texts))
        print('\n'.join(paragraphs))
    except Exception as e:
        print(f"Error reading {path}: {e}")
    print("\n")

for docx_file in glob.glob('d:/Third-Place-Finder-Web/Docs/*.docx'):
    read_docx(docx_file)
