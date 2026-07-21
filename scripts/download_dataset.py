import kagglehub
import os

# Download latest version
path = kagglehub.dataset_download("asimzahid/pakistans-largest-pakwheels-automobiles-listings")

print("Path to dataset files:", path)

# List files in the directory
print("Files in the dataset directory:")
for root, dirs, files in os.walk(path):
    for file in files:
        print(os.path.join(root, file))
