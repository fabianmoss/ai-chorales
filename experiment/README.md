# Experiment

## convert xml to wav 

```bash
```bash 
for f in data/*.xml; do
    musescore "$f" -o "${f%.xml}.wav"
done
```
```

```
```
