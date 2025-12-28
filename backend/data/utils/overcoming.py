# script to process exercises from overcoming gravity

import json
import hashlib

m = hashlib.md5()

with open("/Users/noahhatakeyama/Desktop/workout-skill-tree-website/backend/data/utils/test.json", "r") as f:
    data = json.loads(f.read())

output = [
    {
        "exercises" : [],
        "dependencies": [],
        "categories": [
            "Gymnastics"
        ],
        "difficulties": list(range(0,18)),
        "metadata": {}
    }
]

# exercises
exercises = data[0]
for k, v in exercises.items():

    temp_list = []
    for i, e in enumerate(v):
        m.update(e["name"].encode("utf8"))
        item = {
            "id": str(int(m.hexdigest(), 16))[:12],
            "name": e["name"],
            "difficulty": e["difficulty"],
            "description": "",
            "subset": k,
            "category": "Gymnastics",
            "position": {
                "x": 0,
                "y": 0
            },
            "prerequisites":[
            ]
        }

        temp_list.append(item)
    
    temp_list_lag = [0] + temp_list

    # add prerequisites
    for i, e in enumerate(v):
        if i > 0:
            temp_list[i]["prerequisites"] += [temp_list_lag[i]["id"]]
    
    # append
    output[0]["exercises"] += temp_list

with open("/Users/noahhatakeyama/Desktop/workout-skill-tree-website/backend/data/utils/test_outcome.json", "w") as f:
    json.dump(output, f)
