import os
import re

def process_file(filepath):
    if not os.path.isfile(filepath):
        return
    with open(filepath, 'r') as f:
        content = f.read()

    # Generic Replacements
    # Drone -> Robot, Submersible, etc.
    content = content.replace("Drone Dashboard", "Submersible Dashboard")
    content = content.replace("Drone", "Submersible")
    content = content.replace("drone", "submersible robot")
    
    with open(filepath, 'w') as f:
        f.write(content)

for root, dirs, files in os.walk('src'):
    for file in files:
        if file.endswith(('.jsx', '.js', '.ts', '.tsx')):
            process_file(os.path.join(root, file))

