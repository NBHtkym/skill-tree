with open("/Users/noahhatakeyama/Desktop/workout-skill-tree-website/backend/data/utils/test_outcome copy.json", "r") as f:
    file = f.read()

with open("/Users/noahhatakeyama/Desktop/workout-skill-tree-website/backend/data/skill_tree.json", "w") as f:
    f.write(file)