library("tidyverse")

All_data <- read.csv("[INSERT FILE NAME]")

glimpse(All_data)

All_data[,-35] %>%
  filter()

new_data = filter_all(All_data[,-35], any_vars(. > 0))

# remove rows with 0 in any column except the last column
df_filtered <- subset(All_data, rowSums(All_data[, -ncol(All_data)] == 0) == 0)

# print filtered data frame
glimpse(df_filtered)

write.csv(df_filtered,"[INSERT FILE NAME]", row.names = FALSE)
