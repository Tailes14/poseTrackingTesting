## Combining CSV Files into 1
# Load required packages
library(dplyr)
library(readr)
library(here)

# Set the folder path
folder_path = here("[INSERT FILE WITH ALL CSV FILES HERE]")

# Combine all CSV files in the folder into one data frame
df = list.files(path = folder_path, full.names = TRUE, pattern = "\\.csv$") %>%
  lapply(read_csv) %>%
  bind_rows()

# Export the combined data frame to a new CSV file
output_file = file.path(folder_path, "All_Points.csv")
write.csv(df, output_file, row.names = FALSE)
