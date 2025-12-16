from sweetbean import Block, Experiment, Generic
from sweetbean.stimulus import Text, Blank
from sweetbean.variable import TimelineVariable


def setup(render: str = None):
    # INTRODUCTION
    # create an introduction

    exp = Experiment()

    audio_trial = Generic(
        html="""
        <p>Please listen to the sound and rate it.</p>

        <audio controls autoplay>
        <source src="stimuli/sound1.mp3" type="audio/mpeg">
        Your browser does not support audio.
        </audio>
        """,
        responses=[
            Slider(label="How pleasant was the sound?",
                   min=0, max=100, start=50)
        ],
    )

    exp.add_trial(audio_trial)
    exp.build("audio_experiment")
    exit()

    welcome = Text(
        text="Welcome to our experiment.<br>You will have to react to the color of a word"
    )

    introduction_stimulus = Text(  # duration= 4000,
        text="Welcome to our experiment!<br>"
        + "The experiment will begin in 4 seconds.<br>"
        + "Press SPACE to continue.",
        choices=[" "],
    )

    # create a list of stimuli for the block
    introduction_list = [introduction_stimulus]

    # create the block
    introduction_block = Block(introduction_list)

    # TRIAL
    # create timeline
    timeline = [
        {"color": "red", "word": "RED", "soa": 300},
        {"color": "green", "word": "RED", "soa": 200},
        {"color": "green", "word": "GREEN", "soa": 400},
        {"color": "red", "word": "GREEN", "soa": 500},
    ]

    # declare timeline variables

    color = TimelineVariable(name="color")
    word = TimelineVariable(name="word")

    soa = TimelineVariable(name="soa")

    # declaration of different stimuli
    fixation_onset = Blank(duration=600)
    fixation = Text(duration=800, text="+")
    stimulus_onset = Blank(duration=soa)

    stroop = Text(duration=2500, text=word, color=color)

    stimulus_sequence = [fixation_onset, fixation, stimulus_onset, stroop]
    stroop_block = Block(stimulus_sequence, timeline)

    block_list = [introduction_block, stroop_block]

    # create an experiment
    experiment = Experiment(block_list)

    # render experiment
    if render is not None:
        experiment.to_html(render)

    return experiment


def main():
    setup(render="index.html")


if __name__ == "__main__":
    main()
