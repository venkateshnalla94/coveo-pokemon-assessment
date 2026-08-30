Coveo RGA + Passage Retrieval Cleanup Plan for Pokémon Search

Problem Summary

You currently have two related issues:

1. RGA is returning too much Pokémon data
  • Instead of a concise summarized answer, it returns most or all indexed Pokémon statistics.
2. Passage Retrieval is returning noisy/raw text
  • It retrieves seemingly random text from PokémonDB instead of clean, meaningful passages.

These are related because both RGA and Passage Retrieval depend heavily on the quality of the indexed item content, especially the item’s body.

The target architecture should be:

```text
Pokémon source
    ↓
Clean / transform content
    ↓
Structured metadata + curated body
    ↓
Coveo index
    ↓
Semantic Encoder / RGA / CPR embeddings
    ↓
Relevant retrieval
    ↓
RGA prompt or external LLM
    ↓
Clean user-facing response
```

Right now, the flow is probably closer to:

```text
PokémonDB HTML
    ↓
Entire scraped page indexed into body
    ↓
Chunks contain stats, navigation, tables, footer text, etc.
    ↓
RGA / CPR retrieve those chunks
    ↓
Noisy response
```

Coveo recommends keeping the indexed body as clean, focused, and relevant as possible and removing boilerplate such as navigation, headers, and footers.

────────

1. Inspect the Indexed body First

This should be your first step.

Go to:

```text
Coveo Administration Console
→ Content Browser
→ Select a Pokémon item
→ Quick View / Item Properties
```

Inspect what Coveo currently has inside the item’s body.

You may see something resembling:

```text
Pikachu

Pokédex data

National No...
Type Electric
Species Mouse Pokémon
Height...
Weight...
Abilities...

Base stats
HP 35
Attack 55
Defense 40
...

Training
Breeding
Moves learned
Navigation
Footer
Related Pokémon
...
```

If that is what Coveo sees, that is also the content being used to generate semantic chunks.

The problem therefore happens before RGA generates the final answer.

────────

2. Create an AI-Friendly Pokémon body

Do not use the entire webpage as the semantic document.

Keep detailed attributes as structured Coveo fields.

For example:

```text
@pokemonname = Pikachu
@type = Electric
@hp = 35
@attack = 55
@defense = 40
@speed = 90
@height = 0.4m
@weight = 6kg
@generation = 1
@abilities = Static, Lightning Rod
```

These fields are useful for:

• Facets
• Filters
• Sorting
• Result cards
• Product/detail pages
• Exact searches
• Ranking

But the body should be written primarily for semantic retrieval.

Example:

```html
<h1>Pikachu</h1>

<h2>Overview</h2>
<p>
Pikachu is an Electric-type Pokémon introduced in Generation I.
It is known as the Mouse Pokémon and is one of the most recognizable
Pokémon in the franchise.
</p>

<h2>Characteristics</h2>
<p>
Pikachu is a small Electric-type Pokémon known for storing electricity
in its cheek pouches. It is fast and specializes primarily in
Electric-type attacks.
</p>

<h2>Abilities</h2>
<p>
Its standard ability is Static, while Lightning Rod may be available
as its hidden ability.
</p>

<h2>Evolution</h2>
<p>
Pikachu evolves from Pichu and can evolve into Raichu.
</p>
```

This creates much better semantic chunks than a raw statistics table or scraped webpage.

────────

3. Keep a Small Human-Readable Stats Section

You do not need to remove all Pokémon statistics.

Instead, convert them into a concise natural-language section.

Example:

```html
<h2>Battle Statistics</h2>

<p>
Pikachu has 35 HP, 55 Attack, 40 Defense,
50 Special Attack, 50 Special Defense, and 90 Speed.
</p>
```

This still allows questions such as:

```text
What is Pikachu's speed?
```

while preventing the model from being overwhelmed by large tables or raw HTML.

────────

4. Clean the PokémonDB Web Source

If PokémonDB is being indexed using a Coveo Web source, configure Web Scraping rules.

Use CSS selectors or XPath rules to explicitly include useful content and exclude irrelevant content.

Conceptually:

```text
INCLUDE

Main Pokémon information
Description
Abilities
Evolution
Battle statistics


EXCLUDE

Header
Footer
Navigation
Sidebar
Advertisements
Breadcrumbs
Related Pokémon
Site menus
Large move tables
Unrelated page sections
```

The goal is to prevent irrelevant content from entering Coveo’s body in the first place.

Your Passage Retrieval results probably are not actually random.

They are likely:

> semantically matching chunks from a noisy indexed document.

────────

5. If Using Push API, Build the Semantic Body Yourself

If your ingestion application already receives structured Pokémon JSON, avoid scraping a webpage into body.

Instead, generate the semantic document yourself.

For example:

```ts
const body = `
<h1>${pokemon.name}</h1>

<h2>Overview</h2>
<p>${pokemon.summary}</p>

<h2>Type</h2>
<p>${pokemon.name} is a ${types} Pokémon.</p>

<h2>Abilities</h2>
<p>${abilitiesSentence}</p>

<h2>Evolution</h2>
<p>${evolutionSentence}</p>

<h2>Battle Statistics</h2>
<p>${statsSentence}</p>
`;
```

Then push all other attributes as Coveo metadata fields.

This gives you much more control over what gets embedded and retrieved.

────────

6. Add an RGA Prompt Enhancement

Once retrieval quality is fixed, configure RGA to generate shorter answers.

In the Coveo Administration Console, navigate approximately to:

```text
Machine Learning
→ Models
→ RGA model
→ Edit
→ Configuration
→ Prompt Enhancement
```

Use a Pokémon-specific instruction such as:

```text
You are a Pokémon encyclopedia assistant.

Answer the user's question using only information supported by
the retrieved Coveo content.

Keep answers concise and easy to scan.

When asked generally about a Pokémon:

- Start with a 2-4 sentence summary.
- Mention its type, defining characteristics, notable abilities,
  and evolution only when relevant.
- Do not automatically enumerate every base statistic.
- Do not reproduce complete tables, move lists, metadata, or raw
  source content.
- Only provide detailed numerical statistics when the user explicitly
  asks for stats, comparisons, HP, Attack, Defense, Speed, or similar
  numerical information.

Prefer natural-language synthesis over reproducing source text.

Use short sections or bullets only when they materially improve readability.
```

This handles the answer formatting problem.

It does not replace the need to clean the indexed content.

────────

7. Prefer a Dedicated Pokémon RGA Model

Prompt enhancement is associated with the RGA model.

Therefore, if the model is reused by multiple applications or query pipelines, your Pokémon-specific instructions may affect other experiences.

For your assessment/demo, consider:

```text
Dedicated Pokémon RGA Model
```

paired with:

```text
Dedicated Pokémon Query Pipeline
```

This isolates your configuration.

────────

8. Align Semantic Encoder and RGA Content

Make sure your Semantic Encoder and RGA are operating on the same Pokémon dataset.

Recommended structure:

```text
Pokémon Search Hub
        ↓
Pokémon Query Pipeline
        ↓
┌─────────────────────────┐
│ Semantic Encoder        │
│ Pokémon content only    │
└─────────────────────────┘
        +
┌─────────────────────────┐
│ RGA                     │
│ Pokémon content only    │
└─────────────────────────┘
```

For standalone Passage Retrieval:

```text
Pokémon CPR Pipeline
        ↓
Semantic Encoder
        +
Passage Retrieval Model
```

Dataset alignment reduces unexpected semantic retrieval behavior.

────────

9. Understand What Passage Retrieval Should Return

Passage Retrieval is not an answer-generation feature.

Its responsibility is to retrieve relevant chunks.

For example:

```json
{
  "passages": [
    {
      "text": "Pikachu is an Electric-type Pokémon..."
    },
    {
      "text": "Pikachu evolves from Pichu..."
    }
  ]
}
```

The intended architecture is:

```text
User
"Tell me about Pikachu"

        ↓

Coveo CPR

        ↓

Clean passages

"Pikachu is an Electric-type Pokémon..."
"Pikachu evolves from Pichu..."
"Static is Pikachu's primary ability..."

        ↓

LLM

        ↓

"Pikachu is an Electric-type Pokémon known for..."
```

Do not treat:

```text
passage.text
```

as the final user-facing generated answer.

If you display CPR output directly, it will naturally feel unfinished.

────────

10. Use Structure-Aware Chunking

For RAG applications, prefer structure-aware chunking over arbitrary fixed-size chunks.

Design your body with meaningful document sections:

```html
<h2>Overview</h2>

<h2>Characteristics</h2>

<h2>Abilities</h2>

<h2>Evolution</h2>

<h2>Battle Statistics</h2>
```

Then let the chunker preserve those semantic boundaries where possible.

Check the CPR model configuration and look for something similar to:

```json
"chunkerConfig": {
  "strategy": "STRUCTURE_AWARE"
}
```

If your current model uses fixed-size chunking, test structure-aware chunking after the content cleanup.

────────

11. Tune RGA Retrieval Only After Cleaning Content

After improving the indexed body, you can tune retrieval.

Two useful RGA controls are:

Items to Consider

Controls how many initial search-result documents can contribute semantic chunks.

If irrelevant Pokémon pages or related pages contaminate RGA answers, reduce this value.

Conceptual test:

```text
Current:
100 documents

Test:
20-30 documents
```

────────

Chunk Relevancy Threshold

Controls how semantically relevant a chunk must be before RGA can use it.

Possible progression:

```text
Medium
   ↓
Medium / High
```

Do not make this excessively strict.

A very aggressive threshold can prevent RGA from finding enough evidence to answer.

────────

12. Tune CPR Retrieval Separately

CPR has its own retrieval settings.

For example, the number of candidate documents considered can influence the returned passages.

Start by reducing irrelevant content rather than immediately making retrieval thresholds strict.

Recommended sequence:

```text
Clean source
   ↓
Reindex
   ↓
Rebuild embeddings
   ↓
Evaluate passages
   ↓
Tune retrieval
```

────────

13. Use Chunk Inspector to Debug RGA

Do not debug RGA answers only by looking at the final response.

Use Coveo’s Chunk Inspector to inspect exactly what chunks contributed to an answer.

Test:

```text
Tell me about Charizard.
```

Then inspect the chunks.

If the retrieved chunks contain:

```text
Charizard base stats
HP
Attack
Defense
Mega Charizard
Moves learned
Egg moves
Navigation
...
```

then the problem is primarily:

```text
INDEXING / BODY QUALITY
```

If the chunks instead look good:

```text
Charizard is a Fire/Flying Pokémon...
Charizard evolves from Charmeleon...
Its abilities include...
```

but RGA still dumps every detail, then the problem is primarily:

```text
RGA PROMPT / GENERATION BEHAVIOR
```

This distinction is extremely important.

────────

Recommended Implementation Order

|Priority|Change                                         |Reason                                  |
|--------|-----------------------------------------------|----------------------------------------|
|**P0**  |Inspect Pokémon item’s `body`                  |Understand what RGA/CPR actually see    |
|**P0**  |Clean Web Scraping or Push ingestion           |Remove garbage at the source            |
|**P0**  |Create curated semantic Pokémon `body`         |Highest-impact retrieval improvement    |
|**P1**  |Keep stats/type/generation/etc. as fields      |Preserve facets, filtering, PDP, sorting|
|**P1**  |Reindex Pokémon content                        |Apply new body content                  |
|**P1**  |Rebuild/update embeddings                      |Old embeddings represent old content    |
|**P1**  |Verify RGA + Semantic Encoder dataset alignment|Avoid semantic mismatch                 |
|**P1**  |Add Pokémon-specific RGA prompt instruction    |Produce concise answers                 |
|**P2**  |Enable/check structure-aware chunking          |Improve passage boundaries              |
|**P2**  |Use Chunk Inspector                            |Validate retrieved evidence             |
|**P2**  |Tune items-to-consider                         |Reduce irrelevant source documents      |
|**P3**  |Tune chunk relevance threshold                 |Improve retrieval precision             |
|**P3**  |Add evaluation queries                         |Detect regressions                      |

────────

Recommended Pokémon Index Structure

```text
                    Pokémon API / PokémonDB
                             │
                             ▼
                    Ingestion Transformation
                             │
              ┌──────────────┴──────────────┐
              │                             │
              ▼                             ▼
      STRUCTURED METADATA              SEMANTIC BODY

      @name = Pikachu                  Overview
      @type = Electric                 Characteristics
      @hp = 35                         Abilities
      @attack = 55                     Evolution
      @speed = 90                      Short Stats Paragraph
      @generation = 1
      @ability = Static
              │                             │
              └──────────────┬──────────────┘
                             ▼
                         Coveo Index
                             │
                ┌────────────┴────────────┐
                ▼                         ▼
       Normal Search / Facets       Semantic Retrieval
                                          │
                                   ┌──────┴──────┐
                                   ▼             ▼
                                  RGA           CPR
                                   │             │
                            Prompt Synthesis     │
                                   │             ▼
                                   │       Clean Passages
                                   │             │
                                   ▼             ▼
                            Concise Answer    Your LLM
```

────────

Evaluation Queries to Use

After making the changes, create a small repeatable test set.

General Summary

```text
Tell me about Pikachu.
```

Expected:

• Short overview
• Type
• A few defining characteristics
• No complete statistics dump

────────

Specific Stat

```text
What is Pikachu's speed?
```

Expected:

```text
Pikachu has a base Speed stat of 90.
```

────────

Comparison

```text
Which is faster, Pikachu or Bulbasaur?
```

Expected:

• Retrieve relevant fields/content for both
• Answer comparison directly
• Do not dump all stats

────────

Ability

```text
What abilities does Pikachu have?
```

Expected:

• Static
• Hidden ability when relevant
• No unrelated Pokémon information

────────

Evolution

```text
How does Pikachu evolve?
```

Expected:

• Evolution-specific passage
• No unnecessary stat table

────────

Type Query

```text
Show me Electric-type Pokémon.
```

Expected:

Use structured fields/facets rather than relying entirely on RGA.

────────

Final Principle

Do not try to solve poor retrieval solely with prompt engineering.

Use this sequence:

```text
Clean body
   ↓
Clean chunks
   ↓
Relevant semantic retrieval
   ↓
RGA prompt
   ↓
Concise generated answer
```

For your Pokémon assessment, this also gives you a stronger technical story.

Instead of saying:

> “I changed the RGA prompt so it became shorter.”

you can explain:

> “I separated structured Pokémon attributes from semantic content, cleaned the indexed body, improved chunk boundaries, aligned the semantic retrieval models, inspected the evidence retrieved by RGA, and then applied prompt enhancement for concise synthesis.”

That demonstrates an understanding of the complete RAG pipeline:

```text
Ingestion
→ Index quality
→ Embeddings
→ First-stage retrieval
→ Passage retrieval
→ Grounding
→ Generation