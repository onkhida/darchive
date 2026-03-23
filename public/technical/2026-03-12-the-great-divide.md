---
title: The Great Divide
date: 2026-3-12
desc: An example-based exploration of the algorithm behind Frank Rosenblatt's "Mark I Perceptron", anchored through the lens of an important daily decision of mine.
coverImage: /assets/images/technical/the-great-divide.jpg
---

# Solid Foundations
When I was a child, the most grounding aspects of reality came within the binary. A capacity for nuance came (like for most people) later on, but initially, I was interested in seeing whether something could be, for example, hot or cold, right or wrong, hard or soft, bitter or sweet, or interesting or boring. My satisfaction with a word depended on whether it had an opposite, and trying to understand "why" yields itself to a very simple explanation: it is foundational. 

As intelligent beings, although our abilities to tolerate and operate within the grey is innate, it mostly ever actualises after going through a gestation period. And even then, these binary logic systems remain—sometimes dormantly—in the lowest level of our programming, to be reignited whenever we need them[^1].

If the binary can provide a solid enough architectural base for children to build on top of, it makes sense to start the quest for artificial intelligence at its doorstep. Following this line of thinking, there has been many an algorithm over the years that has attempted to equip machines with the ability to duly make these categorical decisions. The most enduring of these has its origins in Frank Rosenblatt's *"Mark I Perceptron"*, and this foundational layer with which modern AI and neural networks now builds upon has formed the basis for this post. I've dedicated much of my efforts with this entry towards providing a systematic breakdown of how Rosenblatt's original algorithm works as the foundational piece of engineering that it is. I'll go through each iterative step, explaining finally (in a heavily analogical manner) how this all culminates to form a basic computational system capable of making binary conclusions when confronted with a series of relevant data points (vectors). 

# On Vectors
The last word in my introductory section is "vectors", in parentheses. I've been deliberate in putting this mathematical concept in our atmosphere very early on because apart from its use in underpinning the core mechanism with which the perceptron is built upon, thinking of our inputs as vectors is both useful and intuitive. For coming to any decision, even a simple (binary) one, is usually contingent on a multitude of different factors. 

Every morning, before my commute across Lagos from Ojota to TBS (Tafawa Balewa Square), whether or not I wait for the Bus Rapid Transit (BRT) buses to arrive depends on:
* How much money is in my Cowry Card[^2].
* How quickly I can top up my balance if I don't have enough in it.
* How important comfort is for me at the moment, as BRT buses are generally more comfortable than the equivalent journey with several stops across Danfos[^3]. 
* Whether or not I am late for the start of the day.
* Whether or not I can already hear a Danfo conductor belting an alternatively favourable route I could take. 
* What my patience levels are.
* How tired I am.
* And so many other variables that sometimes reveal themselves in the moment.

Because all of these "inputs" are freshly (and uniquely) tied to a certain decision instance that I make each morning, it helps to think of them as related entities that (eventually) coalesce into one big thing, a _vector_. And after considering all these variables, my brain—in milliseconds—comes to a decision before I've even begun my descent along the overhead bridge. 

Of course, some of these variables (even though I may not know it or be able to grade them quantitatively) matter more to me, and this helps me to handle situations where there are some conflicting signals. Technically speaking, due to their varying degrees of importance, they all have their respective, intuitive *weights* in my head, and finding what each of these variables "weigh" remains the core goal of a perceptron algorithm. You'll often see existing literature referring to this process as "finding the weight vector", which also makes sense because if we find the corresponding weights for all the variables, the new list of respective weights can serve as its own vector as well!

> Show of all the inputs entering a neuron with the different weights to yield an output will be ideal.

Another pedagogical advantage, I feel, of having the perceptron's process spin around vectors is that it allows us to conceptualise things graphically. If every decision instance is a vector of relevant variables, then we can plot and represent this specific "point" on a graph, or more correctly, in the vector space[^4]. And if we can plot every single decision instance recursively on this plane, it can allow us to identify some patterns. More acutely, we can reframe this problem as a task to see if we can linearly separate our collection of points. And if we can indeed slice through our collection of points, then _this great divide_ can now act as the decision boundary that will allow us to computationally make these binary decisions. In the future, when we come across a new situation (or decision instance) and are presented with its corresponding vector list of input data, then plotting the vector and identifying what side of the decision boundary the vector point falls on will allow us to come to a binary conclusion. 

Finding the weight vector, finding the corresponding weights for our variables, identifying the decision boundary, and linearly separating our points are all—as you will soon see—many ways of saying the same thing. I only try to think (and get you to think) about this process from a graphical point of view because it really helps make the concept stick, at least from my experience.

# Aligning the Compass
The next set of tools that existing vector mathematics allows us to build upon is that of the "dot product". In extremely simple terms, a dot product takes two vectors of equal dimension, say a pair of 2D vectors $\vec{a} = (x, y)$ and $\vec{b} = (x, y)$, and returns a scalar. This "scalar" provided by the dot product gives us a very useful indicator of how much the two vectors of comparison point in the same direction. The full geometric formula is given below:
$$\vec{a}\cdot\vec{b}=|\vec{a}||\vec{b}|\cos(\theta)$$
(where $|\vec{a}|$ and $|\vec{b}|$ are the magnitudes of vectors $\vec{a}$ and $\vec{b}$ respectively, and the angle, $\theta$, refers to the angle between these two vectors.)

<div class="interactive-component" data-component="vector-playground" data-props="%7B%7D"></div>

Depending on how you played around with the interactive graph, you may have discovered that the dot product of vectors orthogonal to each other is zero. This is for obvious reasons: if $\cos(90^\circ)$—or its radian equivalent, $\cos\left(\frac{\pi}{2}\right)$—yields zero, then the whole expression will also yield zero! 

More pertinently, though, the other thing to notice is that when the angle between both vectors _**is acute**_ (less than $90^\circ$), the resulting dot product gives us a positive number. On the contrary, if this angle between vectors _**is not acute**_ (greater than $90^\circ$), then this derived dot product is negative. You can sit with this detail for a moment because it is important. If we use the weight vector as the cardinal compass that it is, then the sign $(+ve/-ve)$ of the dot product of a data point with respect to a weight vector can easily tell us what half of the landscape a point belongs to. If a point projection (due to its positive dot product) lands in the "northern half" of our "compass", then it belongs to one category; if another projection (due to its negative dot product) lands in the "southern half" of our compass, then it belongs to the other category. 

<div class="interactive-component" data-component="classification-plot" data-props="%7B%7D"></div>

Again, the point of the perceptron (and its training process) is to find the right orientation for this weight vector. It needs to align as a compass, capable of separating the binary categories into each of its halves.

## Without $\theta$
There exists, also, a way to carry out this computation without even knowing the value of $\theta$, the angle between the two vectors. If the vectors are written in their basic component form à la $\vec{a}=(a_1\mathbf{i} + a_2\mathbf{j})$  and $\vec{b}=(b_1\mathbf{i} + b_2\mathbf{j})$, then we can find their dot product $\vec{a}\cdot\vec{b}$ by simply using the distributive property, that is, expanding the bracket.
$$
\begin{gather}
\vec{a}\cdot\vec{b}=(a_1\mathbf{i} + a_2\mathbf{j})\cdot(b_1\mathbf{i} + b_2\mathbf{j}) \\
=a_1\mathbf{i}b_1\mathbf{i}+a_1\mathbf{i}b_2\mathbf{j}+a_2\mathbf{j}b_1\mathbf{i}+a_2\mathbf{j}b_2\mathbf{j} \\
=a_1b_1(\mathbf{i}\cdot\mathbf{i})+a_1b_2(\mathbf{i}\cdot\mathbf{j})+a_2b_1(\mathbf{j}\cdot\mathbf{i})+a_2b_2(\mathbf{j}\cdot\mathbf{j}) \\
=a_1b_1 + a_2b_2
\end{gather}
$$
If you're wondering what happened to the $\mathbf{i}$ and $\mathbf{j}$ symbols on line $(3)$, you must recall what we established earlier about vectors and orthogonality. Since $\mathbf{i}$ and $\mathbf{j}$ are forever perpendicular, then $\mathbf{i}\cdot\mathbf{j}=0$, "taking out" the second and third terms. Conversely, $\mathbf{i}\cdot\mathbf{i}$ and $\mathbf{j}\cdot\mathbf{j}$ evaluate to $1$, preserving the first and last terms.

So, because our cross terms vanish, we are left with an incredibly simple equation to find the dot product between our vectors $\vec{a}=(a_1\mathbf{i} + a_2\mathbf{j})$ and $\vec{b}=(b_1\mathbf{i} + b_2\mathbf{j})$:
$$\vec{a}\cdot\vec{b}=a_1b_1 + a_2b_2$$
Keep in mind that although the equation derived assumes that our vectors, $\mathbf{a}$ and $\mathbf{b}$, are both two-dimensionsional vectors, the formula still scales to vectors of higher dimensions. Indeed, it is on this premise that the perceptron builds its central formula. 

In the perceptron's case, the "weighted sum", $z$, of a vector point is provided by:
$$z=\sum(w_i \cdot x_i)+b$$
At a granular level, the formula is going through every component in vector $w$, identifying its respective component in the vector $x$, and then finding the product of the two corresponding components. It then sums through all the products and adds a bias, $b$ at the end. The equation's expanded form should make it clear that the weighted sum formula is simply finding the dot product between two vectors: $w$ (the weight vector) and $x$ (a data point).
$$z=w_1x_1+w_2x_2+w_3x_3+\cdots+w_nx_n+b$$
If you're like me, you might experience some initial uneasiness with how the $b$ sticks out as a sore thumb in this sea of $w$s (weights) and $x$s (data points). But this is a solvable issue. Since the bias term, $b$, is also just a weight that needs to be learned, it can be rewritten as $w_0x_0$, where $x_0$ is always $1$. And if the value of $x_0$ is constantly $1$, then we can even simply refer to the bias term as $w_0$. I'll be using $w_0$, $w_0x_0$, and $b$ interchangeably in the paragraphs that follow. 

So, because the bias term can be represented as $w_0x_0$, we could simply rewrite the equation of the weighted sum as such:
$$z=w_0x_0+w_1x_1+w_2x_2+\cdots+w_nx_n$$
The reason we even have a bias term in first place is because it gives our weight vector an offset so that it does not always start at the origin. Whilst the weight vector can reorient and point in different directions by adjusting the values of its components, a bias term allows us to move the orthogonal decision boundary it generates "up" or "down" the weight vector. In the component below, you can try and play around with different values of $w_0$, $w_1$, and $w_2$. I'd recommend that you specifically view a weight vector (and thus its decision boundary) with and without a value for $w_0$ (that is, without a bias term) to fully grasp what the bias does for us.

<div class="interactive-component" data-component="weight-vector-controller" data-props="%7B%7D"></div>

Regardless of whatever representation of the weighted sum, $z$, that you use (with $w_0x_0$ or $b$ as the bias term), because the $z$ simply represents the dot product between the weight vector and a point, the sign $(+ve/-ve)$ of the result of this sum, $z$, can now finally tell us to which half that a data point, $x$, belongs to according to the weight vector's current orientation. 

<div class="interactive-component" data-component="weighted-sum-visualizer" data-props="%7B%7D"></div>

The job of the perceptron from this step would then be to then check if this classification coincides with that of the training data, re-orienting if that is not the case.

# Zooming in to Zoom Out
I want to "zoom in" to my initial example about deciding on a BRT bus or not and imagine, in a remarkably simple and hypothetical world, that my decision was only dependent on 2 factors:
1. The amount of money (in NGN) in my Cowry Card.
2. The amount of time (in minutes) I *think* it would take for me to stand in line and board the bus.

<div class="interactive-component" data-component="data-points-table" data-props="%7B%7D"></div>

If you are interested in seeing all the numbers, you can click the "expand" button on the table above. There are 22 decision instances for every weekday (and morning commute) in March[^5]. Something you would notice is that apart from the two columns detailing *the amount of money in my card* and *how long it would take to board a bus*, there is another column of interest: the <u>*decision column*</u>, storing values of $1$ or $-1$. $1$ means I took the bus, and $-1$ means I did not. In the previous section, we talked about how the sign of the dot product is a really good indication of what half of the graph that a vector is in. You can think of these decision categories (of $±1$) as indications of what side of the decision boundary that each point is meant to fall on once training is complete. These values, in fact, are also used as checkers throughout training process to see if the current weight vector is doing a good job of classifying a point.

## On Equal Footing
Before plotting the data points, it is good practice to "normalise" our data. As though the money (in NGN) within my Cowry Card is often in the thousands, the waiting time (in minutes) to board a bus is actually in the tens. This difference in scale/magnitude can be slightly problematic because it may make it difficult for us to *create a weight vector that is duly representative of the structure within the data*. If we leave the values along the money axis in thousands and the values along the minutes axis in tens, then the representative vectors for each data point will have a minutes component in the tens and a money component in the thousands. This will also be true for the learned weight vector, and having the derived weight for "money" in thousands and the weight for "waiting time" in tens simply because of their magnitudes may stop us from intuitively identifying the "strength" or "importance" of these features. By keeping them on equal footing, viz. normalising them, we are able to enforce some sort of standardisation, generating (in the process) a weight vector that astutely ensures comparability across features and shows the pattern within the data independent of arbitrary measuremental quirks. There are also other advantages to this—like improving the time it takes the perceptron to converge on a solution—that make this a paramount part of the algorithimic process[^6].

I've gone about "normalising" this data by using the very intuitive [min-max normalisation](https://www.codecademy.com/article/min-max-zscore-normalization) technique. For each data point, I've simply found the difference between said point and the minimum point in the dataset, and then divided that number by the range of the dataset.
$$x_n=\frac{x-min(X)}{max(X)-min(X)}$$
The result is a standardised value (which I've rounded to 3 decimal places) that distinctly shows the relative strength (on a scale of 0 to 1) of a vector dimension, without the unit bias.

<div class="interactive-component" data-component="graph-plot" data-props="%7B%7D"></div>

## Checks and Balances
Now that we have mapped our normalised data points across the graph, to see how the perceptron goes about finding our decision boundary in practice, we'll need to start by initialising a random weight vector, $\vec{w} = (0.4, 0.4)$.

<div class="interactive-component" data-component="weight-vector-plot" data-props="%7B%7D"></div>

As I explained in the section prior, the line orthogonal to this weight vector—which presents as a dashed line in the graphical illustration above—works as our decision boundary between the two categories. We can see with our naked eye that the perceptron's first boundary does a poor job of classifying the two categories: all of my "decision instances" end up in its "northern half" with none in the "southern half". Ideally, we'd want one category to stay exclusively on one side, with the other category exclusively in the opposite "northern half". 

To figure out how to orient its compass, the perceptron recursively goes through every point in our dataset, **checks*** to see if (based on its current orientation) the point is classified correctly, and adjusts its weight vector (and subsequently its decision boundary) if the point falls on the wrong side of the divisor. But how does it *know*, if a point has been misclassified? It's actually pretty simple. A point has been misclassified if,
$$y (\vec{w}\cdot\vec{x})\leq0$$
The $y$ in this case refers to the label given to a point before the commencement of this training process. You would recall, from my decision column a few paragraphs ago, that I decided to label an instance with $+1$ if I took the bus and $-1$ if I didn't. The reason that multiplying our label, $y$, with the dot product of the weight and input vector, $(\vec{w}\cdot\vec{x})$, is a good way to check if a point has been classified correctly is because it is only when $y (\vec{w}\cdot\vec{x})$ is positive that the point has been classified correctly. If we have a point labelled to the $-1$ category, then it is only when its dot product is negative—showing that it falls on the southern half as defined initially by its label—that the result of  $y (\vec{w}\cdot\vec{x})$ is a positive number. Similarly, if we have a point labelled to the $1$ category, then it is only when its dot product is positive—showing that it falls on the northern half as specified initially by its label—that the result of $y (\vec{w}\cdot\vec{x})$ is a positive number. 

<div class="interactive-component" data-component="misclassification-checker" data-props="%7B%7D"></div>

Now if, indeed, a point has been misclassified, the de facto update rule for the perceptron is as follows.
$$w_n=w_o+yx$$
Here, the new weight, $w_n$, is found by adding $yx$ to the old weight, $w_o$. 
Although we have a heavy conceptual proof backing this update rule, it is easy to see on a conceptual level why this equation suffices as an iterative corrective mechanism. Remember that if a point is misclassified, then the dot product, $\vec{w}\cdot\vec{x}$, simply has the wrong sign. Because of this, adding $yx$ to the existing weight shifts our weight (and its decision boundary) towards the direction of the misclassified point, increasing the likelihood that it is categorised correctly on the next iteration!

<div class="interactive-component" data-component="weight-update-animator" data-props="%7B%7D"></div>

This process of checking each point and updating the boundary (if necessary) will iteratively happen until the perceptron converges on a solution. And it *will* converge on a solution, just as long as the points are linearly separable.

## Stitching the Seams
Hopefully, with a shared understanding of the steps behind the perceptron's learning process, we can pull this knowledge together to take a closer look at how the perceptron will solve my earlier bus problem, finding—through the iterations—how much each factor "weighs" in my decision process by finding a hyperplane to linearly separate the data points.

Whenever you're ready, you can press the play button on the simulation below. You can pause and adjust the speed at which the perceptron does its checks and traverses through each iteration, but really, what you should also be looking at is the perceptron's *"Boundary Diaries"*. As it converges on a solution, the *"Boundary Diaries"* on the side pane will work as a log, providing an iterative explanation of the steps it's taking in applying the algorithm.

<div class="interactive-component" data-component="perceptron-simulator" data-props="%7B%7D"></div>

(Explanation of what the newfound weight vector is, and then a new preclude to talk about how this can help us make a decision)

>Decision component that will help me make a decison depending on the two categories

## Winter Was Coming
At the end of the "Checks and Balances" section, I promised (rather bullishly) that the perceptron "*will* converge on a solution, just as long as the points are linearly separable." My confidence in the perceptron's ability to always find a hyperplane does not emanate from anywhere within me; there is an elucidatory, elegant convergence theorem written 60-odd-years-ago by academics much more accomplished than I currently am. I do not intend on descending into this convergence theory in this post, but what I've only thought to highlight is that the conditional that the convergence theory rests on—"...as long as the points are linearly separable"—turned out to be a limitation large enough to usher in the first AI winter in the 1970s. The world has always been more complex than linear classifications of yes/no, and this initial model I've just presented found it difficult to scale to more complex applications. On some occasions, the problems at hand didn't even need to be complex, as is illustrated by [Minsky & Papert (1969)](https://direct.mit.edu/books/monograph/3132/PerceptronsAn-Introduction-to-Computational) in its inability to solve a simple XOR problem.

<>

For as you can see in the graph above, although we've only plot four points across the graph in (0,0), (0,1), (1,0), and (1,1), its impossible to draw a straight line separating the categories. 

But even if the perceptron only ever had linearly separable data to work with, we have no certitude that the hyperplane it finds will be the "right" one. In the cartesian plane we drew earlier to visualise my hypotheticals, you may have noticed that there were several lines we could have drawn manually to separate the two categories. This fact, that there are many different ways for our points to be classified, introduces an additional element of uncertainty into the fray; it isn't exactly the staunchest bit of technology ever built.

There's were also issues surrounding its initial levels of computational performance. Although its central algorithm remains simple, the requisite iterations needed to learn from swarms of data points meant that in an era were computational power was limited, convergence on a hyperplane was more sloggish than it was seamless.

Yet, despite all these initial difficulties, humanity remains—over 60 years later—grateful for its inception. It's theory has formed the basis for much of what we've discovered regarding the development of intelligence artificially. Even though Rosenblatt's initial design was as a single-layer, linear classifier, it has paved the way for the more complex multi-layer perceptron models, which, as we were to find out across the years, developed into special types of neural networks. It's propogated an atomic, incremental journey in development. We owe much to it.

# For Good Measure
This entry metamorphosed, in part, from notes I took at the turn of the year after reading Anil Ananthaswamy's ["Why Machines Learn"](https://www.amazon.com/Why-Machines-Learn-Elegant-Behind/dp/0593185749). My father bought the book last year and liked it, so I gave it a try. Ananthaswamy also talks about Rosenblatt's perceptron in the first two chapters, and although it's a concept I encountered (in-length) beforehand, his text stands as (by far) my favourite contemporary take on the concept. Throughout the book, his conceptual framing goes beyond core technicalities, and he finds unique ways of masterfully weaving in the relevant bits of situational, social commentary to make the reader feel as though they are living through the developmental timeline and experiencing the creation of our modern systems in real time. It is the next [consumable](http://onkhida.me/consumables) that I am to write about, and if you have even a remote interest in the science underpinning current technology, the book will be worth your time.

But the main accelerator for this post was, of course, my daily commute. After making iterative decisions on whether or not to take a BRT bus, I was interested in seeing (as leisure) if a perceptron algorithm could (hypothetically) learn from the actions I took recursively and figure out the main principles guiding my daily decision. I knew that I was organically considering variables in my head repeatedly, and you could say that I was interested in finding out what each variable _weighed_ in my decision process. The plan initially was to manually gather the "data" for every decision instance en route to work each day in the month of March, logging values for all the consequential variables I could identify (fatigue, patience levels, money in Cowry Card, lateness, etc.). Usually, as I develop, I create build notes of what is being created. But somewhere along the way on this occasion, the prose morphed into a narrative explanation of the processes guiding this experiement, and thus the perceptron. 

I've since accepted this directional pivot in turning this into a technical article. The only caveat is that, because my words came together much faster than my experimental, month-long inquest for data, the figures I've tabularised and used on the plot have been pulled arbitrarily from my head to fit into the central example context. And hopefully, despite this shift in my writing aims, this has still been helpful. I've had fun attempting to make this make sense, and for good measure (and to round things up), I've also created a "demo" of a sample graphical perceptron simulator that you can use outside of this context. I hope to give you an additional space to visualise these concepts: it works in a similar fashion to the components above, and the only real difference is that it gives you the additional liberty of creating your own data vectors. If the categories are separable, it then proceeds to find a weight vector, generating a _"Boundary Diaries"_ similar to the one you've just seen.

[Try It Out Btn]

[^1]: When in survival mode, organisms often compress their clouds of complexity into dichotomous decisions: eat/don't eat, fight/flight, etc.
[^2]: A BRT "Cowry Card" is meant to serve as a seamless and cashless means of payment for bus rides. Riders "top-up" their card balances beforehand and then tap the card once on the bus' card reader for access.
[^3]: Coming mainly in their distinct yellow and black stripes, Danfo buses provide an alternate means of transportation across the city. Their comparatively smaller sizes to BRT buses come with more agility, but they usually traverse through shorter and more segmented routes, hence the many stops to get to a destination.
[^4]: More variables to consider means more dimensions. Instead of a 2D plane (x-axis vs y-axis), we'll need many more axes for each variable, even though we struggle to visualise any dimensions beyond 3D.
[^5]: Nigeria's Federal Government has just announced that the 19th and 20th of this month will be a public holiday due to this year's Eid celebrations. So, technically it will be 20 work days; I've just persisted with 22 because this entry was essentially done when the announcement came in.
[^6]: (Explain why normalisation is important in accelerating convergence?)