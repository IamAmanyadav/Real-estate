import requests
from pathlib import Path

# Create dummy image
img_path = Path('dummy.jpg')
img_path.write_bytes(b'fake image content')

with open(img_path, 'rb') as f:
    files = {'files': ('dummy.jpg', f, 'image/jpeg')}
    res = requests.post('http://localhost:8000/api/v1/uploads/images', files=files)

print("Upload Status:", res.status_code)
print("Response:", res.json())

urls = res.json().get('urls', [])
if urls:
    # Test downloading the image
    img_url = f"http://localhost:8000{urls[0]}"
    print("Testing GET:", img_url)
    get_res = requests.get(img_url)
    print("GET Status:", get_res.status_code)
    print("GET Content:", get_res.content)
