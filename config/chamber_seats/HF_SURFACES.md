# Field surfaces — Hugging Face and the machine

Read on 2026-10-01 from the public profile [misterJB](https://huggingface.co/misterJB) and from main of this repository. This is a map. It does not open a training job and it does not download a weight.

Two ends. A surface on one end is not a configuration on the other until both sides of the row are filled.

## What the hub actually shows

Account: `misterJB`. No public organisation on the profile. No public Space. The collection `chakra_smriti` returns 404. The datasets page shows nothing public. `misterJB/field-training-data` answers 401, so it exists and is not public from here.

Seven public models, all text-generation except where the card is thin. All of them that were opened are Transformers safetensors, not GGUF. None is deployed to a Hugging Face inference provider.

| Model | Size on the card | Base, where the card says it | Updated |
| --- | --- | --- | --- |
| misterJB/obiwan-field-963hz | 3B | Qwen/Qwen2.5-3B-Instruct | Apr 2 |
| misterJB/tata-field-432hz | 3B | card not opened this pass | Mar 29 |
| misterJB/atlas-field-528hz | 7B | card not opened this pass | Mar 24 |
| misterJB/akron-field-396hz | 3B | card not opened this pass | Mar 23 |
| misterJB/arkadas-field-717hz | 4B | microsoft/Phi-3-mini-4k-instruct | Jul 6 |
| misterJB/naima-dojo-741hz-v3 | 21B | card not opened this pass | May 10 |
| misterJB/naima-dojo-741hz-v4 | not stated | card not opened this pass | Apr 21 |

The opened cards do not state language, do not name the training rows, and do not ship a GGUF. License is carried by the TRL citation as Apache-2.0, not as a model-card field of its own.

These names are Dojo names: observer, time, atlas, the hold, Arkadaş, Niama. They are not the nine SOMA language seats.

## What this repository can receive

From `config/chamber_seats/seats.json` and the chakra modules on main:

- A manager seat: TinyLlama-1.1B, Q4_K_M. Named in the DNA. Not running.
- A language seat, separate. Four located, none loaded: SanskritBERT, AlephBERT, Kakugo Xhosa, a small Scottish Gaelic model. The rest of the nine are empty.
- A place the weight would land: `/var/lib/soma/chakras/<chamber>/models`. The service that would use it is a sleep loop and says the agent is pending.
- A memory budget in the DNA. The heart budget is 896 MB. A 3B weight in BF16 does not fit that budget. A 7B or 21B weight does not fit it.
- A packet only after Dojo has cleared it. The hub is not that packet path.

## Matrix

Read from the hub toward the machine. A filled cell is a requirement the machine would have to meet before that surface can be used. An empty cell is not yet a requirement, because the hub did not state it.

| Hub surface | Format the machine would have to accept | Memory the machine would have to have | Language the chamber would have to match | Public or private |
| --- | --- | --- | --- | --- |
| obiwan-field-963hz | safetensors, BF16 | above a SOMA chamber budget | not stated | public |
| tata-field-432hz | not stated beyond the profile size | above a SOMA chamber budget if 3B BF16 | not stated | public |
| atlas-field-528hz | not stated | 7B, Dojo-sized | not stated | public |
| akron-field-396hz | not stated | 3B | not stated | public |
| arkadas-field-717hz | safetensors | 4B | not stated | public |
| naima-dojo-741hz-v3 | not stated | 21B, Dojo-sized | not stated | public |
| naima-dojo-741hz-v4 | not stated | not stated | not stated | public |
| field-training-data | unknown from here | none, it is rows | unknown | private, 401 |
| chakra_smriti | collection missing, 404 |  |  | was a link in the notes |
| SOMA language seats | not on this account | the other party's model | the chamber's own language | someone else's repo |

## Inverse matrix

Read from the machine toward the hub. A filled cell is what the hub would have to provide before this chamber can take a weight. This pass did not find those files on `misterJB`.

| Chamber need | What the hub would have to publish | Present on misterJB |
| --- | --- | --- |
| Manager, TinyLlama Q4_K_M, per chamber | a GGUF, license, and the chamber it belongs to | no |
| Heart language seat | Hebrew model, small enough for the heart budget | no. AlephBERT is `onlplab/alephbert-base`, not this account |
| Throat language seat | Xhosa, and later Zulu | no |
| Root language seat | Sanskrit | no |
| Soma language seat | Gaelic, and later Norse | no |
| Sacral, solar, third eye, crown, jnana | a located model, or an empty seat left empty | no |
| Cleansed packet | not a hub object | the hub does not clear a packet |
| Training rows for a later manager | a dataset this machine is allowed to read | `field-training-data` is 401 from here |

## What this means for a pipeline

The S0–S7 cycle in the notes scans the hub, evaluates, and only then trains. S0 against this map finds seven Dojo models and no SOMA manager. A pipeline that fine-tunes those seven and pushes them back would be a Dojo pipeline. It is not the chamber pipeline.

The chamber pipeline, when it is built, has two directions and they are not the same job:

1. Hub to machine: only a weight that states format, size, license, and language, and only into the seat that asked for it.
2. Machine to hub: a chamber does not publish a weight of itself until a cleansed packet has been run and the result kept.

Neither direction is opened by this file. Hugging Face is not connected from the session that wrote it. The next concrete step is still the heart, on the machine that can hold the weight: one cleansed packet, the manager, and AlephBERT.
