export interface NormalizedDataPoint {
    day: string
    money: number
    waitTime: number
    decision: 1 | -1
    normalizedMoney: number
    normalizedWaitTime: number
}

export interface WeightVector {
    w0: number // bias
    w1: number // money weight
    w2: number // wait time weight
}

export interface IterationStep {
    epoch: number
    pointIndex: number
    pointDay: string
    point: NormalizedDataPoint
    weightBefore: WeightVector
    weightAfter: WeightVector
    dotProduct: number
    isCorrect: boolean
    logMessage: string
}

export interface ConvergenceResult {
    converged: boolean
    epochsNeeded: number
    finalWeights: WeightVector
    iterations: IterationStep[]
}

export function usePerceptronTraining(dataPoints: NormalizedDataPoint[]) {
    const maxEpochs = 100 // Safety limit to prevent infinite loops

    /**
     * Compute dot product: w · x = w0*1 + w1*normalizedMoney + w2*normalizedWaitTime
     */
    function computeDotProduct(weights: WeightVector, point: NormalizedDataPoint): number {
        return weights.w0 * 1 + weights.w1 * point.normalizedMoney + weights.w2 * point.normalizedWaitTime
    }

    /**
     * Check if a point is correctly classified
     * Correct if: y * (w · x) > 0
     */
    function isClassifiedCorrectly(weights: WeightVector, point: NormalizedDataPoint): boolean {
        const dotProduct = computeDotProduct(weights, point)
        return point.decision * dotProduct > 0
    }

    /**
     * Generate human-readable log message for an iteration
     */
    function generateLogMessage(
        epoch: number,
        pointIndex: number,
        point: NormalizedDataPoint,
        dotProduct: number,
        isCorrect: boolean,
        weightBefore: WeightVector,
        weightAfter: WeightVector
    ): string {
        if (isCorrect) {
            const sign = dotProduct > 0 ? '(+)' : '(−)'
            return `Epoch ${epoch}, Iter ${pointIndex + 1}: ${point.day} | dot=${dotProduct.toFixed(3)} ${sign} | Correct ✓`
        } else {
            const update1 = (weightAfter.w1 - weightBefore.w1).toFixed(3)
            const update2 = (weightAfter.w2 - weightBefore.w2).toFixed(3)
            return `Epoch ${epoch}, Iter ${pointIndex + 1}: ${point.day} | dot=${dotProduct.toFixed(3)} | Misclassified ✗ | w updated: [${update1}, ${update2}]`
        }
    }

    /**
     * Train the perceptron using the standard algorithm
     */
    function trainPerceptron(): ConvergenceResult {
        const iterations: IterationStep[] = []

        // Initialize random weights
        let weights: WeightVector = {
            w0: 0.4,
            w1: 0.4,
            w2: 0.4,
        }

        let epoch = 0
        let converged = false

        while (epoch < maxEpochs && !converged) {
            let misclassificationsThisEpoch = 0

            for (let pointIndex = 0; pointIndex < dataPoints.length; pointIndex++) {
                const point: NormalizedDataPoint = dataPoints[pointIndex]!
                const dotProduct = computeDotProduct(weights, point)
                const isCorrect = isClassifiedCorrectly(weights, point)

                const weightBefore = { ...weights }

                if (!isCorrect) {
                    misclassificationsThisEpoch++
                    // Update rule: w_new = w_old + y * x
                    // Where y is the label (-1 or 1) and x is the data point
                    weights.w0 += point.decision * 1 // bias term (x0 = 1)
                    weights.w1 += point.decision * point.normalizedMoney
                    weights.w2 += point.decision * point.normalizedWaitTime
                }

                const logMessage = generateLogMessage(
                    epoch + 1, // (why are we adding epoch+1 to the log message? shouldn't each point within an epoch be grouped together?)
                    pointIndex,
                    point,
                    dotProduct,
                    isCorrect,
                    weightBefore,
                    weights
                )

                iterations.push({
                    epoch: epoch + 1, // (again, should we not just keep all the points for this iteration in the same epoch?)
                    pointIndex,
                    pointDay: point.day,
                    point,
                    weightBefore,
                    weightAfter: { ...weights },
                    dotProduct,
                    isCorrect,
                    logMessage,
                })
            }

            // Check convergence: if no misclassifications in this epoch, we're done
            if (misclassificationsThisEpoch === 0) {
                converged = true
            }

            epoch++
        }

        return {
            converged,
            epochsNeeded: epoch,
            finalWeights: weights,
            iterations,
        }
    }

    return {
        trainPerceptron,
        computeDotProduct,
        isClassifiedCorrectly,
    }
}
