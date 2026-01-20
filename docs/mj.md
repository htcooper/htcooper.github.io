---
layout: page
title: Mahjongg AI (MJAI)

introduction: |
  
    This is a side project that I've been working on for a little while, including as part of [buildspace nights & weekends season 5](https://buildspace.so/){:target="_blank"}. I'll be updating this page as I work through it - **considering the speed of AI, everything below is subject to change**.  

    For a minute, I thought it would be a good idea to create a MJAI Insta: [Mahjongg AI Instagram](https://www.instagram.com/mahjongg_ai/){:target="_blank"}

    ---
    **Status:** MVP in progress (vision model trained; coach agent + UI in development)  
    **Runs on:** Raspberry Pi + webcam/mic  
    **Inputs:** tiles + calls  
    **Outputs:** top 3 targets + discard + clarifying questions

    ---
    ## Background
    Mahjongg is a game of strategy and luck that I enjoy playing. But, I'm slow - I spend a lot of time reading the card, and a lot of time watching what others are doing. There are strategic decisions that have to be made each turn, so I wanted to create something to help me get faster at knowing roughly what I should do next. Is this cheating? Perhaps, although the luck portion of the game means that you can improve your chances of winning, but not guarantee them.  
    
    For me, it will stand in as a skilled player giving me advice. Ideally, I won't need this assistant as much the more that I play.

    This project is built as an uncertainty-driven “coach agent”: when the system isn’t sure what it saw/heard (or when two strategic options are neck-and-neck), it proactively asks you a quick clarifying question instead of silently guessing.

    ---
    ## What it does
    - Computer vision detects and classifies tiles from a webcam feed (43 classes).
    - Audio + speech-to-text transcribes table calls and parses tile names / calls (like "mahjongg!").
    - Strategy engine scores candidate hands (from a Majongg card JSON) and returns the top targets + a discard suggestion.
    - Coach agent detects ambiguity and prompts you for confirmation when confidence is low.
    - LLM narrator turns deterministic strategy output into friendly coaching text (it’s not the decision-maker).

    ---
    ## Product-y Stuff  

    <details markdown="1">
    <summary><span style="font-size: 1.35rem; font-weight: 700;">Target user personas</span></summary>  

    - New Mahjongg players who are just learning  
    - Intermediate Mahjongg players who want to refine their strategy  
    - Anti-personas: advanced players, competition players  

    </details>  

    ---
    <details markdown="1">
    <summary><span style="font-size: 1.35rem; font-weight: 700;">Functional requirements</span></summary>  
    
    - Needs to see/know the player's current hand
    - Needs to know what tiles have been discarded
    - Needs to know what pongs/kongs have been exposed by other players
    - Needs to know whose turn it is
    - Needs to know the overall status/progress of the game (beginning / middle / end of the game)
    - Needs to know and follow the current Mahjongg hands/card (player upload). 
    - Needs American Mahjongg strategy notes.
    - Needs to know American Mahjongg rules (ex. if the player picks up a discard, it should no longer advise any concealed hands, a joker cannot be used to complete a pair or as a single, etc.)
    - Needs to be reasonably portable and able to sit next to the player using it without interfering with the game.  

    </details>  
   
    ---
    <details markdown="1">
    <summary><span style="font-size: 1.35rem; font-weight: 700;">MVP acceptance criteria:</span></summary>  

    - MJAI should be able to see the hand of the user at any point during the game
    - MJAI should be able to correctly track other players through audio cues.
    - MJAI should ask for clarification if needed.
    - MJAI should provides strategy when asked.
    - MJAI should not hallucinate hands or strategy.
    - MJAI should base its strategy only off of the specific card that the user has indicated.
    - MJAI should adjust strategy based on the existing game state (current tiles in hand, tiles played by all players, number of turns left to play in the game)
    - The player should be able to see and interact with the display without disrupting the game.

    ### MVP notes
    - The vision model will be trained on the specific tile set that I use. 
    - It will be compact enough to run on an edge device.
    - MJAI will track the game state through audio cues (players announce which tiles they are discarding and which they are exposing), and will ask for clarification if it doesn't understand.
    - MJAI will only understand English audio cues.

    ### V2 notes
    - Transform the MVP into a mobile app.
    - Vision model will be trained off of a larger varied dataset of MJ tiles.  

    </details>  
    
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
    -- Parses calls + tile names with a Mahjongg-aware normalization step.
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

    This is designed to work like a real coach sitting next to you: it watches and listens continuously, but it only interrupts when it needs clarification.

    ### 0) Setup (before the game)

    * Player selects the **NMJL card file** to use (or confirms the default).
    * Player chooses a lightweight preference (optional): **speed** vs **points**.
    * MJAI confirms the camera and mic are active, then shows a “ready” status.

    ### 1) Charleston (no audio assumptions)

    During the Charleston, MJAI is primarily a **vision-driven helper**.

    * MJAI continuously reads the player’s hand from the camera feed and maintains a **best-known hand state**.
    * On the player’s turn, the player taps **“Coach me”** (or uses a hotkey) to request advice.

        * MJAI re-checks the hand.
        * Strategy engine ranks the top target hands and suggests what to pass/keep.
        * If the hand read is uncertain (tile flicker, ambiguity), the **Coach Agent** asks a quick confirmation question (for example: “Is this a 3 Bam or 3 Crack?”).
    * Repeat for each Charleston pass, including the optional final exchange if your group plays it.

    Notes:

    * MJAI does not rely on table audio during Charleston.
    * Manual correction is always available if the camera read is wrong.

    ### 2) Transition to main play

    When Charleston ends, the player signals that the main game has started.

    * Player taps **“Start Game”** (or uses a voice command / hotkey).
    * MJAI switches to **vision + audio** mode and resets any Charleston-only assumptions.
    
    ### 3) Main game loop (continuous sensing + “ask when uncertain”)

    MJAI runs a repeating loop in the background:

    1. **Sense**
        * Vision module updates the player’s current hand state.
        * Audio module listens for calls/discards and parses game events (for example: “discard 5 dot”, “pung 9 bam”).
    2. **Update state**
        * Game state is updated with:
            - player hand (with confidence)
            - any known discards/exposures (as available via audio)
            - turn/phase markers if provided
            - If MJAI isn’t confident about a detected tile or a parsed call, it creates an **uncertainty event**.
    3. **Coach Agent intervention (only when needed)**
        * If uncertainty crosses a threshold, MJAI prompts the player with a short question.
        * The prompt is rate-limited to avoid interrupting gameplay (unless it’s high urgency).
        * The player can answer via quick buttons (or optional keyboard input).
        * The system updates state based on the answer and continues.
    4. **Advise on demand**
        * When it becomes the player’s turn, the player taps **"My Turn"** (or uses a voice command / hotkey).
        * MJAI recomputes:  
            - Top target hands (ranked)
            - One discard recommendation aligned to those targets
            - Short rationale
        * The LLM narrator rewrites the rationale into friendly coaching text. The underlying recommendation remains deterministic.

    ### 4) End of game + review

    * When a player calls **"Mahjongg!"**, MJAI logs the end state and asks the user to confirm the outcome:
      * **I won**
      * **I lost**
    * MJAI provides a short “what I would do next time” reflection:

      * missed opportunities (for example: “you were one tile away from X for 3 turns”)
      * common confusions (for example: repeated tile ambiguity)
      * a suggested focus area for the next session (speed, calling strategy, reading the card)

    ---

    ### Manual controls (available at any time)

    * **New Game**
    * **End Game**
    * **Resync Hand**
    * **Advance Turn**
    * **Correct Tile**
    * **Mute Coach prompts** (optional: temporarily suppress questions)


    ---
    ## Risks + Considerations
    - Speed: 
        - MJAI might be slow and interfere with gameplay
            - ensure low-latency processing for real-time interaction
            - run a background loop that updates state continuously, but only computes "full advice" when the user requests it
            - keep vision model small and edge-device compatible
            - rate-limit Coach Agent prompts so the system asks questions only when it matters
    - Perception accuracy (camera + mic): 
        - Tile detection might be wrong or unstable (tiles flicker between labels, overlap, or shift): 
            - track a confidence score per tile/slot and decay confidence when detections are unstable
            - provide fast manual correction (tap-to-fix) and a "Resync Hand" control
            - prefer stable “tile slots” over simple left-to-right sorting as the UI matures
        - Speech-to-text mishears calls (wrong calls/tile name, background noise):
            - constrain parsing to a Mahjongg-specific vocabulary and normalize common variations
            - use the Coach Agent to confirm ambiguous calls instead of silently updating state
            - provide a quick "undo / correct last event" control
    - Strategy correctness (don’t make stuff up):
        - MJAI suggests hands or rules that don’t exist on the selected card, or ignores American Mahjongg constraints (joker rules, exposed vs concealed restrictions, etc.)
            - only score candidate hands sourced from the user-selected card file 
            - keep strategy logic deterministic and testable (unit tests for rules + pattern matching)
            - treat LLM narrator as "wording only" and never allow it to alter the underlying recommendation
    - Coach Agent behavior (helpful vs annoying)
        - Coach Agent asks too many questions and becomes distracting
            - rate-limit prompts (max prompts/minute + minimum spacing)
            - only interrupt on low confidence or high-impact ambiguity
            - allow the user to temporarily mute prompts while keeping passive status indicators
        - Coach Agent asks too few questions and silently proceeds with bad assumptions
            - escalate urgency when confidence drops below a hard threshold
            - surface a persistent "Needs confirmation" indicator when unresolved uncertainty exists
    - Data handling + privacy (post MVP)
        - Capturing camera/mic data could create privacy concerns at a live table
            - default to local-only processing on the device
            - avoid uploading audio/video by default; if logs are enabled, store them locally and make them opt-in
            - be explicit on this page about what is recorded (if anything) and how to disable it


    ---
    ## Resources
    - RT Object Detection app (just being used to test the vision model): [View Github](https://github.com/htcooper/mahjongg-ai-tutor){:target="_blank"}



---