import pandas as pd
import tensorflow as tf
import numpy as np
import matplotlib.pyplot as plt
from numpy import loadtxt
from os import path
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense
from tensorflow.keras.layers import Dropout

# import csv file and convert to pandas dataframe
dataset = loadtxt('squat.csv', delimiter=',')
dataset_df = pd.DataFrame(dataset)

# randomly split data into training (70%) and testing (30%)
# testing is created by dropping the training data from the entire dataframe
training_df = dataset_df.sample(frac=0.7)
testing_df = dataset_df.drop(training_df.index)

# print size of training and testing dataframes
print(f"Number of training examples: {training_df.shape[0]}")
print(f"Number of testing examples: {testing_df.shape[0]}")

# convert dataframes to numpy arrays
training_data = training_df.to_numpy()
testing_data = testing_df.to_numpy()

# create features (joint coordinates) and labels (pose number)
features = training_data[:, 0:34]  # features are the data given to the model
label = training_data[:, 34]  # label is what is being predicted

test_features = testing_data[:, 0:34]
test_label = testing_data[:, 34]

if path.exists("model.h5"):  # after creating and saving a model, it can be retrained
    print("Training existing model")
    model = tf.keras.models.load_model('model.h5')
    model.summary()
else:  # if a model isn't being retrained, this creates one
    print("Creating new model")
    model = Sequential()

    # creates layers for neural network
    # the product of the number of nodes should be around 1/10 of the number of rows of data
    model.add(Dense(21, activation='relu'))  # first hidden layer of n nodes

    # if overfitting include a dropout layer
    #model.add(Dropout(0.2))

    model.add(Dense(8, activation='relu'))  # second hidden layer of n nodes
    model.add(Dense(3, activation='softmax'))  # output layer of n nodes

    model.predict(features)  # allows the network to create an input layer on its own

    # can be used to change the learning rate
    # default is 0.1
    # replace 'adam' with optimizer
    #optimizer = tf.keras.optimizers.Adam(learning_rate=0.1)
    model.compile(optimizer='adam',
                  loss=tf.keras.losses.SparseCategoricalCrossentropy(from_logits=True),
                  metrics=['accuracy'])

    model.summary()
# fits model with features and label arrays
# history allows for graphing
# epochs can be changed depending on how the network learns
history = model.fit(features, label, epochs=1000, batch_size=20, validation_split=.2, shuffle=True)

_, accuracy = model.evaluate(features, label)  # evaluates trained model using validation set

predictions = model.predict(test_features)  # creates predictions array

# creates variables to determine the accuracy of the model
num_labels = len(test_label)
true_positive = 0
false_positive = 0

# determines if the model's predicted label is accurate or not
for i in range(num_labels):
    predicted_label = np.argmax(predictions[i])
    if test_label[i] == predicted_label:
        true_positive += 1
    else:
        false_positive += 1

# creates and prints model accuracy
model_accuracy = true_positive / num_labels
print(f"Accuracy: {model_accuracy}")

# saves model as an .h5 file
model.save('model.h5')
print("Model Saved")

# creates accuracy and loss graph
plt.plot(history.history['accuracy'], label='accuracy')
plt.plot(history.history['loss'], label='loss')
plt.title("Accuracy and Loss")
plt.ylim([0, 1])
plt.xlabel('Epoch')
plt.ylabel('Accuracy and Loss')
plt.legend()
plt.grid(True)
plt.show()
