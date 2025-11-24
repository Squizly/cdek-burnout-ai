from langchain.prompts import PromptTemplate
prompt_template = PromptTemplate(
    template="""
A dictionary with the user's current mean scores for emotional exhaustion, depersonalization, and reduced professional accomplishment.
{averages}
A dictionary with the user's three most recent test results for these dimensions.
{df_last_3}
A list of the user's current projects and tasks.
{projects}
Analyze this and вecide whether the user needs to take a burnout test.
The answer should be:
True - if it is necessary for user to pass test
False - if it isn't necessary

If True, write short message-recommendation in official style in Russian.
""", input_variables=["averages", "df_last_3", "projects"]
)