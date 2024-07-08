---
layout: page
title: Mahjongg AI (MJAI)

introduction: |
  
    This is a side project that I've been working on for a little while. I'm finishing it up as part of [buildspace nights & weekends season 5](https://buildspace.so/){:target="_blank"}. I'll be updating this page as I work through it - **everything below is subject to change**.  

    ---
    ## Background
    Mahjongg is a game of strategy and luck that I enjoy playing. But, I'm slow - I spend a lot of time reading the card, and a lot of time watching what others are doing. There are strategic decisions that have to be made each turn, so I wanted to create something to help me get faster at knowing roughly what I should do next. Is this cheating? Perhaps, although the luck portion of the game means that you can improve your chances of winning, but not guarantee them.  
    
    For me, it will stand in as a skilled player giving me advice. Ideally, I won't need this assistant as much the more that I play.

    ---
    ## What it will do
    MJAI will make recommendations based on American Mahjongg strategy. Based on the tiles played and the player's current hand, it should recommend strategy:
    - In the Charleston, it should recommend which tiles to keep and which to trade for each round
    - In the main game, it should recommend which hands are good bets - and which tiles to discard
    - It should give the player no more than 3 strategic suggestions at a time, ranked if possible.

    ## What it will not do
    - Track the potential hands of other players
    - Try to guess other players' strategies (as a primary goal)
    - Suggest strategies to play defensively (no pants on the ground)

    ---
    ## Target User Personas
    - New Mahjongg players who are just learning
    - Intermediate Mahjongg players who want to refine their strategy  
    - Anti-personas: advanced mahjongg players, players in a competition environment

    ---
    ## Functional requirements
    - Needs to see/know the player's current hand
    - Needs to know what tiles have been discarded
    - Needs to know what pongs/kongs have been exposed by other players
    - Needs to know whose turn it is
    - Needs to know the overall status/progress of the game (beginning / middle / end of the game)
    - Needs to know and follow the current Mahjongg hands/card for this year. 
    - Needs American Mahjongg strategy notes.
    - Needs to know American Mahjongg rules (ex. if the player picks up a discard, it should no longer advise any concealed hands, a joker cannot be used to complete a pair or as a single, etc.)
    - Needs to be reasonably portable and able to sit next to the player using it without interfering with the game.
   
    ---
    ## MVP acceptance criteria:
    - MJAI should be able to see the hand of the user at any point during the game
    - MJAI should be able to correctly track other players through audio cues.
    - MJAI should ask for clarification if needed.
    - MJAI should provides strategy when asked.
    - MJAI should not hallucinate hands or strategy.
    - MJAI should base its strategy only off of the specific card that the user has indicated.
    - MJAI should adjust strategy based on the existing game state (current tiles in hand, tiles played by all players, number of turns left to play in the game)
    - The player should be able to see and interact with the display without disrupting the game.

    ## MVP notes
    - The card being used for the game can be hard-coded in. 
    - The vision model will be trained on the specific tile set that I use. 
    - The trained vision and NLU models will be compact enough to run on an edge device.
    - MJAI will track the game state through audio cues (players announce which tiles they are discarding and which they are exposing), and will ask for clarification if it doesn't understand.
    - MJAI will only understand English audio cues.

    ## MVP hardware
    - MJAI will run off of a Raspberry Pi.
    - Camera/mic will be through a webcam.
    - Interface will use a display attached to the Raspberry Pi. 

    ---
    ## V2 notes
    - Transform the MVP into a mobile app.
    - Allow users to upload the MJ card they want to use.
    - Vision model will be trained off of a larger varied dataset of MJ tiles.  
    
    --- 
    ## Architecture
    
    - Image Processing Pipeline:
        - Camera captures images.
        - Images are sent to the edge device.
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
    ## Basic Workflow
    - Capture: Camera and microphone capture real-time data.
    - Process: Images and audio are processed for object detection and speech-to-text conversion.
    - Analyze: Processed data is analyzed for intent recognition and context understanding.
    - Advise: Real-time advice is generated and displayed to the user.

    ---
    ## Agentic Workflow (MVP)

    ![Agentic Workflow](/assets/images/MJAI_Workflow.png "Agentic Workflow")

    - User starts the game workflow with the AI Agent (MJAI)

    - Charleston (Charleston can be 3 or 6 turns with an optional final exchange):
        - MJAI views current user's hand + remembers that information
        - When it is the user's turn, prompt MJAI for advice:
            - MJAI views current hand (image processing pipeline)
            - MJAI gives advice on proceeding
            - repeat for each stage of the Charleston
            - note: there are no audio cues at this stage

    - Transition to main game:
        - Voice prompt or keyboard input to signal the start of the actual game (voice processing pipeline)
    
    - Main game:
        - MJAI tracks vocal cues that indicate what tiles other users are discarding or exposing. (voice processing pipeline)
            - game state recorded to txt file
        - Voice trigger or keyboard input signals the user's turn and prompts MJAI for strategy advice.  (voice processing pipeline)
            - MJAI views current hand (image processing pipeline)
            - MJAI gives advice on proceeding
            - MJAI will reference all knowledge gathered to date when providing advice.

    - End of game
        - Player announces they have won  (voice processing pipeline).
        - MJAI prompts user if they won/lost.
        - User indicates whether they won or lost.
        - MJAI provides final advice for improvement next time.

    ---
    ## Risks + Considerations
    - Speed: 
        - MJAI needs to provide advice in a timely manner as to not interfere with gameplay
            - ensure low-latency processing for real-time interaction
            - keep models small and edge-device compatible
    - Accuracy: 
        - MJAI may hallucinate valid hands: 
            - use appropriate GPT instructions/reasoning strategy to minimize hallucinations
            - lean on RAG to reinforce correct card information
        - MJAI may mis-identify tiles:
            - use high-accuracy models for reliable object detection and intent recognition
            - consider keeping transparent recording of audio/visual cues for user
            - consider manual confirmation/ability to correct by user
        - MJAI may forget which tiles have been played:
            - ensure agent memory to track all tiles 'seen' by the AI ('seen' via object detection model and 'heard' via speech-to-text model). 
            - store tile history in a text file and use RAG (+ describe text file data in GPT instructions for better retrieval)
    - Security: Implement robust security measures to protect data and user privacy

    ---
    ## Resources
    - Basic Custom GPT: [View here](https://chatgpt.com/g/g-GRfqK6q6W-mahjongg-tutor){:target="_blank"}
    - RT Object Detection app: [View Github](https://github.com/htcooper/mahjongg-ai-tutor){:target="_blank"}



---