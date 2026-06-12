from pathlib import Path


def load_text(file_path):
    """
    Reads a text file and returns its content as a string.
    """
    path = Path(file_path)
    return path.read_text(encoding="utf-8")


def extract_keywords(text, keywords):
    """
    Checks which keywords from a predefined list appear in the given text.
    """
    text_lower = text.lower()

    found_keywords = []

    for keyword in keywords:
        if keyword.lower() in text_lower:
            found_keywords.append(keyword)

    return found_keywords


def calculate_match_score(cv_skills, job_skills):
    """
    Calculates a simple match score based on how many job-required skills
    are found in the CV.
    """
    if not job_skills:
        return 0

    matching_skills = set(cv_skills).intersection(set(job_skills))
    score = len(matching_skills) / len(job_skills) * 100

    return round(score, 2)


def main():
    cv_text = load_text("data/sample_cv.txt")
    job_text = load_text("data/sample_job_ad.txt")

    skill_keywords = [
        "Python",
        "SQL",
        "dbt",
        "Machine Learning",
        "Data Analytics",
        "Data Visualization",
        "Business Intelligence",
        "Git",
        "LLMs",
        "NLP",
        "Hugging Face",
        "FastAPI",
        "Docker",
        "Cloud",
        "Statistics",
        "Data Cleaning",
    ]

    cv_skills = extract_keywords(cv_text, skill_keywords)
    job_skills = extract_keywords(job_text, skill_keywords)

    matching_skills = set(cv_skills).intersection(set(job_skills))
    missing_skills = set(job_skills).difference(set(cv_skills))

    match_score = calculate_match_score(cv_skills, job_skills)

    print("AI Job Application Assistant - Basic Matcher")
    print("--------------------------------------------")
    print(f"Match Score: {match_score}%")
    print()
    print("Matching Skills:")
    print(sorted(matching_skills))
    print()
    print("Missing Skills:")
    print(sorted(missing_skills))


if __name__ == "__main__":
    main()