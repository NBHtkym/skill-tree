import json

with open("/Users/noahhatakeyama/Desktop/workout-skill-tree-website/backend/data/utils/skill_tree.json", "r") as f:
    new_position_json = json.load(f)

with open("/Users/noahhatakeyama/Desktop/workout-skill-tree-website/backend/data/skill_tree.json", "r") as f:
    old_position_json = json.load(f)

out_list = []
for e_n in new_position_json["exercises"]:
    for e_o in old_position_json["exercises"]:
        if e_n["id"] == e_o["id"]:
            e_o["position"] = e_n["position"]
            out_list.append(e_o)
            continue

old_position_json["exercises"] = out_list

with open("/Users/noahhatakeyama/Desktop/workout-skill-tree-website/backend/data/skill_tree.json", "w") as f:
    json.dump(old_position_json, f)