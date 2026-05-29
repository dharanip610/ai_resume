import pandas as pd
from backend.supabase_client import load_data


def generate_excel():

    data = load_data()

    # 🔥 safety check
    if not data:
        raise Exception("No data found in Supabase")

    # convert to dataframe safely
    df = pd.DataFrame(data)

    # optional: only needed columns
    columns = ["name", "email", "phone", "skills", "filename", "status"]

    df = df[columns] if all(col in df.columns for col in columns) else df

    file_path = "resumes.xlsx"

    # create excel file
    df.to_excel(file_path, index=False)

    return file_path