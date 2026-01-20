---
layout: page
title: Mahjongg AI (MJAI)

introduction: |
  
    This is a side project that I've been working on for a little while, including as part of [buildspace nights & weekends season 5](https://buildspace.so/){:target="_blank"}. I'll be updating this page as I work through it - **considering the speed of AI, everything below is subject to change**.  

    For a minute, I thought it would be a good idea to create a MJAI Insta: [Mahjongg AI Instagram](https://www.instagram.com/mahjongg_ai/){:target="_blank"}

    ---
    Status: MVP in progress (vision model trained; coach agent + UI in development)  
    Runs on: Raspberry Pi + webcam/mic  
    Inputs: tiles + calls  
    Outputs: top 3 targets + discard + clarifying questions

    ---
    ## Background
    Mahjongg is a game of strategy and luck that I enjoy playing. But, I'm slow - I spend a lot of time reading the card, and a lot of time watching what others are doing. There are strategic decisions that have to be made each turn, so I wanted to create something to help me get faster at knowing roughly what I should do next. Is this cheating? Perhaps, although the luck portion of the game means that you can improve your chances of winning, but not guarantee them.  
    
    For me, it will stand in as a skilled player giving me advice. Ideally, I won't need this assistant as much the more that I play.

    This project is built as an uncertainty-driven “coach agent”: when the system isn’t sure what it saw/heard (or when two strategic options are neck-and-neck), it proactively asks you a quick clarifying question instead of silently guessing.

    ---
    ## What it will do
    - Computer vision detects and classifies tiles from a webcam feed (43 classes).
    - Audio + speech-to-text transcribes table calls and parses tile names / calls (like "mahjongg!").
    - Strategy engine scores candidate hands (from an NMJL card JSON) and returns the top targets + a discard suggestion.
    - Coach agent detects ambiguity and prompts you for confirmation when confidence is low.
    - LLM narrator turns deterministic strategy output into friendly coaching text (it’s not the decision-maker).

    ---
    <details markdown="1">
    <summary><span style="font-size: 1.35rem; font-weight: 700;">Target user personas</span></summary>  

    - New Mahjongg players who are just learning  
    - Intermediate Mahjongg players who want to refine their strategy  
    - Anti-personas: advanced players, competition players  

    </details>  

    ---
    ## Functional requirements
    - Needs to see/know the player's current hand
    - Needs to know what tiles have been discarded
    - Needs to know what pongs/kongs have been exposed by other players
    - Needs to know whose turn it is
    - Needs to know the overall status/progress of the game (beginning / middle / end of the game)
    - Needs to know and follow the current Mahjongg hands/card (player upload). 
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
    - The vision model will be trained on the specific tile set that I use. 
    - It will be compact enough to run on an edge device.
    - MJAI will track the game state through audio cues (players announce which tiles they are discarding and which they are exposing), and will ask for clarification if it doesn't understand.
    - MJAI will only understand English audio cues.

    ## MVP hardware
    - MJAI will run off of a Raspberry Pi.
    - Camera/mic will be through a webcam.
    - Interface will use a display attached to the Raspberry Pi. 

    ---
    ## V2 notes
    - Transform the MVP into a mobile app.
    - Vision model will be trained off of a larger varied dataset of MJ tiles.  
    
    --- 
    ## More about the Coach Agent!

    Most systems in this space either (a) silently guess when inputs are messy, or (b) constantly ask you to confirm everything.  
    
    I'm aiming for a middle path: ask only when it matters.  

    ### What the coach detects  
    The coach watches for uncertainty across vision, audio, and strategy. Examples:  
    - Ambiguous tile: “I'm seeing either 3 Bam or 3 Crack in slot 9.”
    - Unstable detection: a tile keeps flipping across frames.
    - Ambiguous call: “Did you say pung or kong?”
    - Close hand scores: “Two hands are close: Hand A vs Hand B.”

    ### When it interrupts (decision logic)  
    - High confidence (> 0.9): auto-proceed, no question
    - Medium (0.6–0.9): ask if not rate-limited
    - Low (< 0.6): always ask, increase urgency

    ### Rate limiting (so it doesn't become annoying)  
    - Max 3 prompts per minute
    - Minimum 5 seconds between prompts
    - High-urgency events can bypass limits

    ---
    ## Architecture

    ### Codebase Modules:  
    - Vision
    -- TensorFlow model inference from an Azure Custom Vision export.
    -- Recognizes 43 tile classes and maps labels into internal Tile objects.
    - Audio
    -- Captures audio chunks and transcribes with Whisper.
    -- Parses calls + tile names with a Mahjong-aware normalization step.
    - Game State
    -- Tracks the best-known current hand, discards/calls, and a confidence level.
    - Strategy Engine
    -- Scores candidate hands, returns top targets, and generates discard advice.
    -- Supports a preference signal like "speed" vs "points" (used in sorting).
    - Coach Agent
    -- Produces uncertainty events + generates short questions + processes answers.
    -- Integrates with the orchestrator and UI (distinct "coach question" widget).
    - Orchestrator
    -- Coordinates all modules, runs the main processing loop, and routes events.
    -- The processing loop pulls detections, updates state, runs strategy, updates UI, decays confidence.

    ---
    ## UI
    Designed for an 800×480 Raspberry Pi touchscreen layout.  
    Core UI areas:
    - Current hand
    - Top target hands (ranked)
    - Discard recommendation
    - Status + confidence indicator
    - Coach prompt area (when needed)

    ---
    ## Resilience + manual controls
    Real-world inputs are messy, so the system is built to degrade gracefully (and let you override).  
    Manual controls include: New Game, End Game, Resync Hand, Advance Turn, Tile Correction.  

    ---
    ## Basic Workflow

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
            - Voice/image data processed and results returned to MJAI
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
        - MJAI might be slow and interfere with gameplay
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
            - ensure agent memory to track all tiles 'seen' and 'heard' by the AI ('seen' via object detection model and 'heard' via speech-to-text model). 
            - store tile history in a text file and use RAG (+ describe text file data in GPT instructions for better retrieval)
    - Security: Implement robust security measures to protect data and user privacy

    ---
    ## Resources
    - RT Object Detection app (just being used to test the vision model): [View Github](https://github.com/htcooper/mahjongg-ai-tutor){:target="_blank"}



---