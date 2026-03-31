import os
import glob
import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    replacements = [
        # Inputs and selects
        (r'dark:bg-gray-700 dark:text-white', 'bg-surface-container-highest text-on-surface'),
        (r'bg-gray-300 dark:bg-gray-700', 'bg-surface-container-high'),
        (r'bg-white dark:bg-gray-600', 'bg-surface-container-highest'),
        (r'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600', 'bg-surface-container-low text-on-surface-variant'),
        (r'hover:bg-gray-200', 'hover:bg-surface-container-high'),
        (r'bg-gray-100 dark:bg-gray-700', 'bg-surface-container-high'),
        (r'hover:bg-gray-50 dark:hover:bg-gray-700/50', 'hover:bg-surface-container-low'),
        
        # Skeletons and badges
        (r'text-gray-400', 'text-outline-variant'),
        (r'text-gray-700 dark:text-white', 'text-on-surface font-display'),
        (r'text-gray-600', 'text-on-surface-variant'),
        (r'text-gray-500', 'text-outline-variant'),
        (r'text-white', 'text-on-primary'),
        
        # Specifically, fix the `text-white` when we replaced primary gradients
        # Actually `text-on-primary` is already output.
        
        (r'text-black', 'text-on-primary'), # from the Add button
    ]

    new_content = content
    for pattern, replacement in replacements:
        new_content = re.sub(pattern, replacement, new_content)

    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

dirs = [
    '/home/christian/Bureau/CHRISTIAN/ClefCloud/frontend/src/pages',
    '/home/christian/Bureau/CHRISTIAN/ClefCloud/frontend/src/components'
]

for d in dirs:
    for filepath in glob.glob(os.path.join(d, '**/*.jsx'), recursive=True):
        process_file(filepath)
