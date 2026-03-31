import re

with open('/home/christian/Bureau/CHRISTIAN/ClefCloud/frontend/src/components/Layout/Header.jsx', 'r') as f:
    header = f.read()

# Replace classes based on design tokens
header = header.replace('bg-white dark:bg-gray-900 shadow-md sticky top-0 z-50 transition-colors', 'bg-surface-container-lowest/80 backdrop-blur-xl sticky top-0 z-50 transition-colors')
header = header.replace('text-gray-800 dark:text-white', 'text-on-surface font-display')
header = header.replace('text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400', 'text-on-surface-variant hover:text-primary')
header = header.replace('text-gray-700 hover:text-purple-600 transition font-medium active:scale-95bg-primary-600 hover:bg-primary-700 px-4 py-2 rounded-lg transition font-medium shadow-md active:scale-95', 'bg-gradient-to-br from-primary to-primary-container text-on-primary px-6 py-2 rounded-full transition-all shadow-ambient active:scale-95')
header = header.replace('text-gray-700 hover:text-purple-600', 'text-on-surface hover:text-primary')
header = header.replace('bg-white dark:bg-gray-900 shadow-2xl', 'bg-surface-container-lowest shadow-ambient')
header = header.replace('bg-primary-600 text-white hover:bg-primary-700 transition-all shadow-lg', 'bg-gradient-to-br from-primary to-primary-container text-on-primary hover:opacity-90 transition-all shadow-ambient rounded-full')
header = header.replace('border-b border-gray-200 dark:border-gray-700', 'bg-surface-container-low')
header = header.replace('border-t border-gray-200', 'bg-surface-container-low')

with open('/home/christian/Bureau/CHRISTIAN/ClefCloud/frontend/src/components/Layout/Header.jsx', 'w') as f:
    f.write(header)

