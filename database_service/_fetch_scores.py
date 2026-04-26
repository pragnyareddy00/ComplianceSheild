import os
from langsmith import Client
from dotenv import load_dotenv

load_dotenv()
client = Client()

project_prefix = "Compliance_Graph_Eval_"

try:
    # Find the most recent project matching our prefix
    projects = client.list_projects()
    matching_projects = [p for p in projects if p.name.startswith(project_prefix)]
    
    if not matching_projects:
        print(f"No projects found starting with {project_prefix}")
        exit()
        
    latest_project = sorted(matching_projects, key=lambda x: x.created_at, reverse=True)[0]
    project_name = latest_project.name
    print(f"Fetching scores for latest run: {project_name}")

    runs = client.list_runs(project_name=project_name, is_root=True)
    feedback_totals = {}
    feedback_counts = {}
    
    for run in runs:
        # feedback_stats is sometimes available directly on the run
        if hasattr(run, 'feedback_stats') and run.feedback_stats:
            for key, stat in run.feedback_stats.items():
                val = stat.get("value", 0)
                feedback_totals[key] = feedback_totals.get(key, 0) + val
                feedback_counts[key] = feedback_counts.get(key, 0) + 1
    
    print("\n=== AGGREGATED PIPELINE METRICS ===")
    if not feedback_totals:
        print("Waiting for OpenAI judges to finish async processing. Please view the live dashboard instead.")
    else:
        overall_sum = 0
        metric_count = 0
        for key in feedback_totals:
            avg = (feedback_totals[key] / feedback_counts[key]) * 100
            print(f"-> {key}: {avg:.1f}%")
            overall_sum += avg
            metric_count += 1
            
        if metric_count > 0:
            overall_score = overall_sum / metric_count
            print("\n==================================")
            print(f"🌟 OVERALL SYSTEM SCORE: {overall_score:.1f}%")
            print("==================================")
        
except Exception as e:
    print(f"Error: {e}")
