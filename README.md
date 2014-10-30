# MemoryOverflow Agent

[![Build Status](https://travis-ci.org/CodeCorico/MemoryOverflow-agent.svg)](https://travis-ci.org/CodeCorico/MemoryOverflow-agent)
[![Coverage Status](https://img.shields.io/coveralls/CodeCorico/MemoryOverflow-agent.svg)](https://coveralls.io/r/CodeCorico/MemoryOverflow-agent)
[![Website Status](http://agent.memoryoverflow.org/status.svg)](https://github.com/CodeCorico/MemoryOverflow-website)

The Machine Special Agent for automated tasks.

:exclamation: This repo doesn't takes PR contribution. It's maintained by the CodeCorico team but you can still post issues.

## Features

- When the website code or content changes, MemoryOverflowAgent regenerate it on the [Website repo](https://github.com/CodeCorico/MemoryOverflow-website)
- When an Agent post a new issue, MemoryOverflowAgent checks if the formatting followed [the conventions](https://github.com/CodeCorico/MemoryOverflow/blob/master/CONTRIBUTING.md). Otherwise he:
  - Post a comment on the issue that explains how to format the message
  - Add the `needs: user story/bug format` label
- If an Agent fix its issue and add a comment, MemoryOverflowAgent checks the new formatting issue and remove the `needs: user story/bug format` label if the format is valid.
- When an Agent post a new comment on an issue, MemoryOverflowAgent checks how many there are votes :+1: (or `+1`) and apply special labels on the issue.

## Follow the project

MemoryOverflow is a card game designed by developers for developers. Go to http://memoryoverflow.org to see it in action!

* [Website](http://memoryoverflow.org)
* [Licence](https://github.com/CodeCorico/MemoryOverflow-website/blob/master/LICENSE)
* [GitHub contribution Project](https://github.com/CodeCorico/MemoryOverflow)
