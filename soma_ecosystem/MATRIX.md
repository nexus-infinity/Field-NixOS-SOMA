# What each shape does

The shapes were drawn. They are not one shape. A hexagon does not do the work of the hive, and neither of them is the prime.

A frequency is not an address. Dojo's tetrahedron is not a SOMA address. It appears inside `sacred_geometry/metatron_cube_translator.nix` and stays on Dojo's side of the page.

## The matrix

| Channel | What the shape actually does | Where it is | Why it is separate | When it is used | How it is built | In place | Not in place |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Nine flakes | One ecosystem per chamber. The seat. | `chakras/<name>/` and `chambers/<prime>/volume/` | A flake is a sovereign chamber, not a folder style. | When seating a chamber. | One flake, one prime, one volume, one DNA. | Nine flake files. Nine DNA files at v0.2.0. | The process. The weight. |
| Prime | The clock, and the address. Cycles of 2, 3, 5, 7, 11, 13, 17, 19, 23 never share a factor, so the chambers do not step together. | The DNA `prime_id`, and the mathematical specification. | A prime is not a frequency and not a vertex. | When deciding the tick, and when naming the chamber. | The DNA already carries the prime. The tick is not running. | The nine primes, written. | A clock that fires them. |
| Prime fractal | A chamber may contain a smaller copy of the whole. One survivor can regrow the others from the DNA it carries. | Mathematical specification, TinyRick section. The petal script. | Recursion is depth inside one chamber. It is not a second hive. | After a chamber is seated, and if it fails. | The flake reference, the vertex, and the edges travel inside the DNA. | The rule, written. `scripts/soma-prime-petal-generator.py`. | A chamber that has regrown anything. |
| Octahedron, the hive | Who must agree. Eight vertices and one centre. A change needs two neighbours. The centre listens and does not command. Top replaces a failed vertex. Bottom notices drift. | [Mathematical specification](https://app.notion.com/p/0d3046c4a5494d52ba39d8bf1144875a). | This is coordination. It is not a picture of a flower, and it is not Dojo's pyramid. | When a chamber wants to commit a change, or when one has failed. | Nine services, edges between them, a centre that can veto and cannot order. | The vertices, the twelve edges, the failure cases, all written. | The services. They sleep. |
| Hexagon | How neighbours tile a flat without a gap and without an apex. Six sides. A bee uses it because it covers ground with the least wall. | The hexagonal section of `sacred_geometry/metatron_cube_translator.nix`. | Nine chambers cannot be the six corners of one hexagon. The file currently places nine angles around a centre and also calls that centre Dojo. | When asking who shares an edge on a plane. Not when counting chambers. | Six neighbour relations. The nine stay on the octahedron. | The intention to tile, written. | A placement that fits. The angles repeat. |
| Ghost and volume | Where a weight sits. Source does not change. The living copy belongs to one prime. | `soma_ecosystem/PATHS.md`. | A catalogue is not a path. Dojo's shelf is not a volume. | When a flake opens a model. | Directories, then the DNA points at its own volume. | The addresses, written. | The directories on the machine. The weights. |
| Dojo tetrahedron | Dojo's own where, why, how, and what. Upper and lower, with a bridge between them. | The same translator file, above the hexagon. | It is Dojo's genotype. Leaving it in a SOMA file is how the shelf and the chambers swapped. | On Dojo's side, at the membrane, when a packet crosses. | Not built again here. | Dojo already has this seating. | Nothing for SOMA to copy into a flake. |

## What goes in a flake, and nowhere else

A flake receives: its prime, its volume path, its DNA, the two neighbours that must agree, and its tick. It does not receive a Dojo model, a frequency as a name, or a hexagon as a count of chambers.

The centre, prime 23, is the listener. It is not a tenth copy of the other eight, and it is not the hexagon.
