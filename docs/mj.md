---
layout: page
title: Mahjongg AI (MJAI)

introduction: |
  
     
    This is a side project that I've been working on for a little while. I'm finishing it up as part of buildspace nights & weekends season 5. I'll be updating this page as I work through it - **everything below is subject to change**.  

    ---
    # Background
    Mahjongg is a game of strategy and luck that I enjoy playing. But, I'm slow - I spend a lot of time reading the card, and a lot of time watching what others are doing. There are strategic decisions that have to be made each turn, so I wanted to create something to help me get faster at knowing roughly what I should do next. Is this cheating? Perhaps, although the luck portion of the game means that you can improve your chances of winning, but not guarantee them.  
    
    For me, it will stand in as a skilled player giving me advice. Ideally, I won't need this assistant as much the more that I play.

    ---
    # What it will do
    MJAI will make recommendations based on American Mahjongg strategy. Based on the tiles played and the player's current hand, it should recommend strategy:
    - In the Charleston, it should recommend which tiles to keep and which to trade for each round
    - In the main game, it should recommend which hands are good bets - and which tiles to discard
    - It should give the player no more than 3 strategic suggestions at a time, ranked if possible.

    # What it will not do
    - Track the potential hands of other players
    - Try to guess other players' strategies (as a primary goal)
    - Suggest strategies to play defensively (no pants on the ground)

    ---
    # Functional requirements
    - Needs to see/know the player's current hand
    - Needs to know what tiles have been discarded
    - Needs to know what pongs/kongs/chows have been exposed by other players
    - Needs to know whose turn it is
    - Needs to know the overall status/progress of the game (approximate number of hands remaining)
    - Needs to know and follow the current Mahjongg hands/card for this year. 
    - Needs American Mahjongg strategy notes.
    - Needs to know American Mahjongg rules (ex. if the player picks up a discard, it should no longer advise any concealed hands, a joker cannot be used to complete a pair or as a single, etc.)
    - Needs to be reasonably portable and able to sit next to the player using it without interfering with the game.
    - The user should be able to see and interact with the display.

    # MVP acceptance criteria:
    - MJAI can see the hand of the user at any point during the game
    - MJAI can track other players through audio cues.
    - MJAI asks for clarification if needed.
    - MJAI provides strategy when asked.
    - MJAI does not hallucinate hands or strategy.
    - MJAI bases its strategy only off of the specific card that the user has indicated.
    - MJAI can adjust strategy based on the existing game state (current tiles in hand, tiles played by all players, number of turns left to play in the game)

    # MVP notes
    - The card being used for the game can be hard-coded in. 
    - The vision model will be trained on the specific tile set that I use. 
    - The trained vision and NLU models will be compact enough to run on an edge device.
    - MJAI will track the game state through audio cues (players announce which tiles they are discarding, which ), and will ask for clarification if it doesn't understand.

    # MVP hardware
    - MJAI will run off of a Raspberry Pi.
    - Camera/mic will be through a webcam.
    - Interface will use a display attached to the Raspberry Pi. 

    # V2 notes
    - Transform the MVP into a mobile app.
    - Allow users to upload the MJ card they want to use.
    - Vision model will be trained off of a larger varied dataset of MJ tiles.  
    
    --- 
    # Architecture
    
    - Image Processing Pipeline:
        - Camera captures images.
        - Images are sent to the edge device or cloud server.
        - Object detection model processes images and identifies objects.
        - Results are sent to the backend via APIs.  
    - Voice Processing Pipeline:
        - Microphone captures audio.
        - Audio is sent to the speech-to-text engine.
        - Text is processed by the NLP model to identify intent.
        - Intent and text are sent to the backend via APIs.
    - Backend Integration:
        - Backend receives data from image and voice processing pipelines.
        - Data is analyzed to provide contextual advice.
        - Real-time advice is generated using a GPT model and sent back to the user interface.
    - User Interface:
        - (Testing) Displays real-time images and identified objects.
        - (Testing) Shows transcribed text and identified intents.
        - Provides real-time advice to the user based on processed data.

    ---
    # Workflow
    - Capture: Camera and microphone capture real-time data.
    - Process: Images and audio are processed for object detection and speech-to-text conversion.
    - Analyze: Processed data is analyzed for intent recognition and context understanding.
    - Advise: Real-time advice is generated and displayed to the user.

    ---
    # Considerations
    - Latency: Ensure low-latency processing for real-time interaction.
    - Security: Implement robust security measures to protect data and user privacy.
    - Accuracy: 
        - Use high-accuracy models for reliable object detection and intent recognition.
        - Use appropriate GPT reasoning strategy to minimize hallucinations.


---