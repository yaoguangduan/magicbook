from uuid import uuid1
from fastapi.responses import StreamingResponse
from nicegui import ui, app

CHUNK_SIZE = 1024*1024 # 1 MiB

#: {uuid: (file like or bytes, filename)}
files = {}

def download(data, filename="download",media_type="application/octet-stream"):
    uuid = str(uuid1())
    files[uuid] = (data, filename,media_type)
    ui.navigate.to(f"/download_streaming/{uuid}")

@app.get("/download_streaming/{uuid}")
def _download_streaming(uuid: str):
    data, filename,media_type = files.pop(uuid)

    def iter_file():
        with data:
            while True:
                chunk = data.read(CHUNK_SIZE)
                if chunk:
                    yield chunk
                else:
                    break

    def iter_bytes():
        for i in range(0, len(data), CHUNK_SIZE):
            yield data[i: i+CHUNK_SIZE]

    if hasattr(data, "read"):
        iter_data = iter_file
    else:
        iter_data = iter_bytes

    return StreamingResponse(iter_data(),media_type=media_type, headers={'Content-Disposition': f'attachment; filename="{filename}"','Content-Length': str(len(data))})