"""
Script to (re-)organise the exercises in a nice visual way.

Algorithm 1: Sugiyama-style
"""
import json
import networkx as nx
import matplotlib.pyplot as plt

import networkx as nx

def layout_exercises_with_sugiyama(json_data):
    # Create a directed graph
    G = nx.DiGraph()

    # Helper to map subset letters to integers, default to 0
    subset_map = {}
    subset_counter = 0

    for exercise in json_data:
        subset = exercise.get('subset', 0)

        # Map string subsets to integers
        if isinstance(subset, str):
            if subset not in subset_map:
                subset_map[subset] = subset_counter
                subset_counter += 1
            subset = subset_map[subset]

        G.add_node(exercise['id'], subset=subset)

    # Add edges after nodes are added
    for exercise in json_data:
        for prereq in exercise['prerequisites']:
            G.add_edge(prereq, exercise['id'])

    # Compute Sugiyama layout
    pos = nx.multipartite_layout(G, subset_key='subset')

    # Update the positions in the JSON data
    for exercise in json_data:
        node_id = exercise['id']
        if node_id in pos:
            exercise['position']['x'] = pos[node_id][0] * 2e3  # Scale
            exercise['position']['y'] = pos[node_id][1] * 2e3

    return json_data, G, pos


# Example usage with multiple disjoint trees
with open("/Users/noahhatakeyama/Desktop/workout-skill-tree-website/backend/data/utils/skill_tree_no_coord.json", "r") as f:
    json_data = json.loads(f.read())

# Apply the Sugiyama layout
json_data_with_positions, G, pos = layout_exercises_with_sugiyama(json_data["exercises"])

with open("/Users/noahhatakeyama/Desktop/workout-skill-tree-website/backend/data/utils/skill_tree.json", "w") as f:
    json_data["exercises"] = json_data_with_positions
    json.dump(json_data, f)

# # Print the updated JSON data
# print(json.dumps(json_data_with_positions, indent=4))

# Draw the graph
nx.draw(G, pos, with_labels=True, node_size=500, node_color='skyblue', font_size=10, font_weight='bold', arrowsize=20)
plt.show()

