---
title: The Great Divide
date: 2026-3-12
desc: Exploring the semantic web and how meaningful markup creates more accessible and intelligent digital experiences.
coverImage: /assets/images/technical/the-great-divide.jpg
---

# The Base We Build Upon

When I was a child, the most grounding aspects of reality came within the binary. The capacity for nuance came (like for most people) later on, but initially, I was interested in seeing whether something could be, for example, hot or cold, right or wrong, hard or soft, bitter or sweet, or interesting or boring. My satisfaction with a word depended on whether it had an opposite, and trying to understand "why" yields itself to a very simple explanation: it is foundational. 

As intelligent beings, although our abilities to tolerate and operate withing the grey is innate, it only actualises after going through a gestation period. And even then, these binary logic systems remain—sometimes dormantly—in the lowest level of our programming, to be reignited whenever we need them [^1].

If the binary can provide a solid enough architectural base for children to build on top of, it makes sense to start the quest for artificial intelligence at its doorstep. Following this line of thinking, there has been many an algorithm over the years that has attempted to equip machines with the ability to duly make these categorical decisions. The most enduring of these is Frank Rosenblatt's perceptron, the foundational layer with which modern AI and neural networks builds upon.

And so I want to, with this entry, provide a systematic breakdown of how Rosenblatt's original algorithm works, as the foundational piece of engineering that it is. We'll go through each iterative step, explaining finally (with examples) how this all culminates to form a basic computational system capable of making binary conclusions when confronted with a series of relevant data points (vectors). 

# On Vectors
The last word in my introductory section is "vectors", in parentheses. I've been deliberate in putting this mathematical concept in our atmosphere very early on because apart from its use in underpinning the core mechanism with which the perceptron is built upon, thinking of our inputs as vectors is both useful and intuitive. For coming to any decision, even a simple (binary) one, is usually contingent on a multitude of different factors. Every morning, before my commute across town from Ojota to TBS (Tafawa Balewa Square), whether or not I wait for the BRT buses to arrive depends on:
* How much money is in my Cowry card 
* how quickly I can top up my balance if I don't have enough in it
* How important comfort is for me at the moment, as BRT buses are generally more comfortable than the equivalent journey with several stops across Danfos. 
* Whether or not I am late for the start of the day.
* Whether or not I can already hear a Danfo conductor belting a favourable route I could take. 
* What my patience levels are
* How tired I am.
* And so many other variables that sometimes reveal themselves in the moment.

Because all of these "inputs" are fresh and unique to a certain decision instance that I make each morning, it helps to think of them as related entities that (eventually) coalesce into one big thing, a _vector_.

And after considering all these variables, my brain—in milliseconds—comes to a decision before I've even begun my descent along the overhead bridge. Of course, some of these variables (even though I may not know it or be able to grade them quantitatively) matter more to me, helping me to handle situations where there are some conflicting signals. Technically speaking, due to their varying degrees of importance, they all have their respective, intuitive weights in my head, and finding what each of these variables "weigh" remains the core goal of a perceptron algorithm. You'll often see existing literature referring to this process as "finding the weight vector", which also makes sense because if we find the corresponding weights for all the variables, the new list of respective weights can serve as its own vector as well!

Another pedagogical advantage, I feel, of having the perceptron's process spin around vectors is that it allows us to conceptualise things graphically. If every decision instance is a vector of relevant variables, then we can plot and represent this specific "point" on a graph, or more correctly, in the vector space [^2]. And if we can plot every single decision instance recursively on this plane, it can allow us to identify some patterns. More acutely, we can reframe this problem as a task to see if we can linearly separate our collection of points. And if we can indeed slice through our collection of points, then _this great divide_ can now act as the decision boundary that will allow us to computationally make these binary decisions. In the future, when we come across a new situation (or decision instance) and are presented with its corresponding vector list of input data, identifying what side of the decision boundary the vector point falls on will allow us to come to a binary conclusion. 

Finding the weight vector, finding the corresponding weights for our variables, identifying the decision boundary, and linearly separating our points are all—as you will soon see—many ways of saying the same thing. I try to think (and get you to think) about this process from a graphical point of view because it really helps make the concept stick, at least from my experience.

[You Need A Brief Section on the Dot Product before what is next. 'Tis paramount. "Reading The Compass" seems like a fitting name]

# Zooming In to Zoom Out
I want to "zoom in" to my initial example about deciding on a BRT bus or not and imagine, in a remarkably simple and hypothetical world, that my decision was only dependent on 2 factors: the amount of money (in NGN) in my Cowry Card and the amount of time (in minutes) it would take me to top up my card. As a side quest, I briefly thought about gathering this "data" manually [^3], en route to work each day, but my words came together much faster than the experimental, month-long inquest for data did. As a result, I've pulled these figures arbitrarily from my head to fit into the example's context.

[Table Component Here]

If you are interested in seeing all the numbers, you can click the "expand" button on the table above. There are 31 decision instances for every day (and morning commute) in March [^4]. Something you would notice is that apart from the two figures for the amount of money in my card and how long it would take to top it off, there is another column of interest: the decision column, storing values of 1 or -1. 1 means I took the bus, and -1 means I did not. The reason why I'm using ±1 to indicate if I took the bus will feel odd right now, but the math we'll see in a moment will help in clearing our uncertainties. 

For now, though, let's try and "plot" each instance point on the graph below.

[Insert Graph Plot Component Below]

With your human eye, you might be able to spot a pattern on the generated graph. We can already see a slight "rift" between our two categories of interest, and finding a linear divisor along this graph is definitely doable. To see how the Perceptron goes about finding our decision boundary in practice, we'll need start by initialising a weight vector, $$w = \begin{pmatrix} x \\ y \end{pmatrix}$$.

[Insert Weight Vector + Illustration of the Orthogonal Line]

As explained in the prior section, the orthogonal, dashed line (which I've also added to the graph) works well as our decision boundary, or divisor. Currently, it's obviously wrong; the 


- Must its weight also reflect the 

In geometry, every vector defines a line perpendicular to it.

[^1]: When in survival mode, organisms often compress their clouds of complexity into dichotomous decisions: eat/don't eat, fight/flight, etc.
[^2]: More variables to consider means more dimensions. Instead of a 2D plane (x-axis vs y-axis), we'll need many more axes for each variable, even though we can't visualise any dimensions higher than 3D.
[^3]: (Describe what the manual process will look like in this footnote a la logging data each morning)
[^4]: I'm not on-site every on weekends, so in reality, this number is much smaller. But it is a hypothetical number, and 31 seems like a nice figure to go with.