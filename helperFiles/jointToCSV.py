import time
from tkinter import *
from random import *
from tkinter.filedialog import askopenfilename
import os
import json
import csv 
import math

root = Tk() 
text = Text(root)
root.geometry("800x800") 
size_input = StringVar()

options = [
    "JJ Bottom",
    "JJ Middle",
    "JJ Top"
]

clicked = StringVar()
clicked.set( options[0]  )
    
def file_selection():
    filename = askopenfilename()
    name, extension = os.path.splitext(filename)
    file_name = os.path.basename(name)

    f = open(filename, "r")
    if(extension != ".json"):
        file_selection()
        
    data = json.load(f)
    if(len(data) == 0):
        startButton = Button(root, fg = "red", text = "JSON File Empty",command = file_selection, padx=200, font="Times 10" ).place(x =340, y = 400, height = 80, width = 150)
    
    if(size_input.get() == '' ):
        size_input.set(1)
    
    filtered_points = []
    filtered_frame = []
    point_val = {}
                    
    for i in range(len(data)): 
       if( len(data[i]) == 18):
           point_val[i] = data[i][17]
           del data[i][17]
       elif( len(data[i]) == 19):
           point_val[i] = data[i][17]
           del data[i][18]
           del data[i][17]

       filtered_points = [point for point in data[i] if point['score'] > .5]
       filtered_frame.append(data[i])
    
    for frame in filtered_frame:
        for points in frame:
            if( points['score'] < .5):
                points['x'] = 0
                points['y'] = 0

  
    final_backlash_position = 0 # text file directory creation start 
    for char in reversed(filename):
        final_backlash_position += 1
        if(char == '/'):
            break
        
    filename_length = len(filename)
    folder_directory_length = filename_length - final_backlash_position
    download_directory = ''
    
    for i in range(folder_directory_length):
        download_directory += filename[i]
        
    data_text_directory = download_directory + file_name + '.txt' # text file creation end 

    try:
        with open(data_text_directory , 'w') as f:
            inline_frame_counter = 0
            line_display = 0
            for i in range( len(filtered_frame) ):
                if(inline_frame_counter != 0):
                    inline_frame_counter -= 1
                    continue
                while inline_frame_counter != int( size_input.get() ) : 
                    try:
                        gotdata = filtered_frame[ i + int( inline_frame_counter ) ]
                    except IndexError:
                        gotdata = filtered_frame[ i ]
                        break
                    for k, points in enumerate ( filtered_frame[ i + int( inline_frame_counter ) ] ):
                        for j, ( keys, values )  in enumerate( points.items() ):
                            if(keys == 'score'):
                                continue
                            elif(k == len(filtered_frame[ i + int( inline_frame_counter ) ]) - 1  ):
                                if( isinstance(values, str) ):
                                    continue
                                f.write( str(values) + ',')
                            else:
                                if( isinstance(values, str) ):
                                    continue
                                f.write( str( values ) + "," )
                    inline_frame_counter += 1
                if(inline_frame_counter == 1 ): 
                    inline_frame_counter = 0 
                f.write(str( point_val[i] ) )
                f.write("\n")                 
                line_display += 1
                            
        with open(data_text_directory, 'r') as f1:
            with open(download_directory + file_name + '.csv', 'w', ) as csv_file:
                
                headerlist = [ "x.nose y.nose x.lefteye y.lefteye x.righteye y.righteye x.lefteary.leftear x.rightear y.rightear x.leftshoulder y.leftshoulder x.rightshoulder y.rightshouder x.leftelbow y.leftelbow x.rightelbow y.rightelbow x.leftwrist y.leftwrist x.rightwrist y.rightwrist x.lefthip y.lefthip x.righthip y.righthip x.leftknee y.leftknee x.rightknee y.rightknee x.leftankle y.leftankle x.rightankle y.rightankle" ]
                headerlist2 = [ 'x.nose', 'y.nose', 'x.lefteye', 'y.lefteye', 'x.righteye', 'y.righteye', 'x.leftear', 'y.leftear', 'x.rightear', 'y.rightear', 'x.leftshoulder', 'y.leftshoulder', 'x.rightshoulder', 'y.rightshouder', 'x.leftelbow', 'y.leftelbow',  'x.rightelbow' , 'y.rightelbow' , 'x.leftwrist',  'y.leftwrist',  'x.rightwrist', 'y.rightwrist', 'x.lefthip', 'y.lefthip' , 'x.righthip' , 'y.righthip' ,'x.leftknee' , 'y.leftknee',  'x.rightknee', 'y.rightknee' , 'x.leftankle', 'y.leftankle', 'x.rightankle' , 'y.rightankle' ]
                headercopy = []
                
                for i in range( int(size_input.get()) ):
                    if(size_input.get() == 1):
                        break
                    for elements in headerlist2:
                        headercopy.append(elements)
                    
                headercopy.append('posePrediction')
                
                writer_object = csv.writer(csv_file)
                writer_object.writerow(headercopy)
            
                for line in f1.readlines(): 
                    csv_file.write( line.replace(' ',',') )
                     
    except FileNotFoundError:
        print("Error finding directory; Mac enforced only")
    
    
    startButton = Button(root, fg = "green", text = "Sucessfully Ran",command = file_selection, padx=200, font="Times 10" ).place(x =340, y = 600, height = 80, width = 150)
    
titleLabel = Label(root, text="JSON Point Filter", font="Times 16").place(anchor = 'center', x=400, y=15)
sub_title_label = Label(root, text="Please Select a JSON File Below ", font="Times 10").place(anchor = 'center', x= 400, y=33)
size_input_label = Label(root, text = 'Window Size Input', font=('calibre',10, 'bold')).place(x =360, y = 480, height = 40, width = 110)
size_input_field = Entry(root, textvariable = size_input, font=('calibre',10,'normal')).place(x =360, y = 520, height = 40, width = 110)
startButton = Button(root, fg = "red", text = "Select JSON File and Run",command = file_selection, padx=200, font="Times 10" ).place(x =340, y = 600, height = 80, width = 150)

#drop_down_field = Label(root, text = 'Pose Options', font=('calibre',10, 'bold')).place(x =360, y = 240, height = 40, width = 110)
#dropDown = OptionMenu( root , clicked , *options ).place(x =360, y = 280)

root.resizable(False, False)

root.mainloop()  