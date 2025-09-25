import requests
import json
import os


for item in os.listdir('./testing'):
  if os.path.isdir(os.path.join('./testing', item)):
    for subitem in os.listdir(os.path.join('./testing', item)):
      if subitem.endswith('json'):
        with open(os.path.join('./testing', item, subitem), 'r') as f:
          content = f.read()
          json_data = json.loads(content)
          print(json_data)

          url = json_data.get("url")
          request_data = json_data.get("request", [])
          response_data = json_data.get("response", [])

          for req in request_data:
              method = req.get("method")
              url += req.get("url")
              body = req.get("body")

              response = requests.request(method=method, url=url, json=body)

              print(f"Response for {method} {url}: {response.status_code}")
              print(response.json())
