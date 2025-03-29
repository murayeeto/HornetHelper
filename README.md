# HornetHelper

A study assistance platform with AI-powered features.

## Dataset Setup

The textbook recommendation feature uses the US College Textbooks and Courses dataset from Kaggle. To set up the dataset:

1. Download the dataset from Kaggle: [US College Textbooks and Courses Dataset](https://www.kaggle.com/datasets/polartech/us-college-textbooks-and-courses-dataset)
2. Create a `csv` folder in the root directory of the project
3. Extract and place the textbooks CSV file in the `csv` folder
4. Rename the file to `textbooks.csv`

Alternatively, you can use kagglehub to download the dataset programmatically:
```python
import kagglehub
path = kagglehub.dataset_download("polartech/us-college-textbooks-and-courses-dataset")
```

## Features

- Real-time chat for study sessions
- AI-powered Q&A assistance
- Educational resource recommendations:
  - Educational videos from YouTube
  - Relevant textbooks from the dataset
- Comprehensive FAQ section with:
  - General platform information
  - Study group guidance
  - Premium features details
  - Interactive AI demo