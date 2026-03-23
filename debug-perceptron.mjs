import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Raw data
const rawDataRaw = [
    { day: 'Mar 1', money: 150, waitTime: 28, decision: -1 },
    { day: 'Mar 2', money: 3200, waitTime: 12, decision: 1 },
    { day: 'Mar 3', money: 280, waitTime: 32, decision: -1 },
    { day: 'Mar 4', money: 4100, waitTime: 10, decision: 1 },
    { day: 'Mar 5', money: 320, waitTime: 30, decision: -1 },
    { day: 'Mar 8', money: 2500, waitTime: 15, decision: 1 },
    { day: 'Mar 9', money: 0, waitTime: 35, decision: -1 },
    { day: 'Mar 10', money: 3900, waitTime: 12, decision: 1 },
    { day: 'Mar 11', money: 450, waitTime: 26, decision: -1 },
    { day: 'Mar 12', money: 5200, waitTime: 9, decision: 1 },
    { day: 'Mar 15', money: 75, waitTime: 31, decision: -1 },
    { day: 'Mar 16', money: 4800, waitTime: 11, decision: 1 },
    { day: 'Mar 17', money: 180, waitTime: 33, decision: -1 },
    { day: 'Mar 18', money: 2800, waitTime: 14, decision: 1 },
    { day: 'Mar 19', money: 520, waitTime: 29, decision: -1 },
    { day: 'Mar 22', money: 3500, waitTime: 13, decision: 1 },
    { day: 'Mar 23', money: 400, waitTime: 27, decision: -1 },
    { day: 'Mar 24', money: 5600, waitTime: 8, decision: 1 },
    { day: 'Mar 25', money: 1200, waitTime: 22, decision: -1 },
    { day: 'Mar 26', money: 4200, waitTime: 11, decision: 1 },
    { day: 'Mar 29', money: 1800, waitTime: 19, decision: 1 },
    { day: 'Mar 30', money: 6000, waitTime: 9, decision: 1 },
]

// Normalize
function normalize(value, min, max) {
    if (max === min) return 0
    return (value - min) / (max - min)
}

const moneyValues = rawDataRaw.map(p => p.money)
const waitValues = rawDataRaw.map(p => p.waitTime)
const moneyMin = Math.min(...moneyValues)
const moneyMax = Math.max(...moneyValues)
const waitMin = Math.min(...waitValues)
const waitMax = Math.max(...waitValues)

const dataPoints = rawDataRaw.map(point => ({
    ...point,
    normalizedMoney: normalize(point.money, moneyMin, moneyMax),
    normalizedWaitTime: normalize(point.waitTime, waitMin, waitMax),
}))

// Training logic
function computeDotProduct(weights, point) {
    return weights.w0 * 1 + weights.w1 * point.normalizedMoney + weights.w2 * point.normalizedWaitTime
}

function isClassifiedCorrectly(weights, point) {
    const dotProduct = computeDotProduct(weights, point)
    return point.decision * dotProduct > 0
}

function trainPerceptron() {
    const iterations = []
    let weights = { w0: 0.4, w1: 0.4, w2: 0.4 }
    let epoch = 0
    const maxEpochs = 100
    let converged = false

    while (epoch < maxEpochs && !converged) {
        let misclassificationsThisEpoch = 0

        for (let pointIndex = 0; pointIndex < dataPoints.length; pointIndex++) {
            const point = dataPoints[pointIndex]
            const dotProduct = computeDotProduct(weights, point)
            const isCorrect = isClassifiedCorrectly(weights, point)

            const weightBefore = { ...weights }

            if (!isCorrect) {
                misclassificationsThisEpoch++
                weights.w0 += point.decision * 1
                weights.w1 += point.decision * point.normalizedMoney
                weights.w2 += point.decision * point.normalizedWaitTime
            }

            iterations.push({
                epoch: epoch + 1,
                pointIndex,
                pointDay: point.day,
                normalizedMoney: point.normalizedMoney,
                normalizedWaitTime: point.normalizedWaitTime,
                decision: point.decision,
                dotProduct: dotProduct.toFixed(6),
                isCorrect,
                weightBefore,
                weightAfter: { ...weights },
                weightChanged: !isCorrect,
            })
        }

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

// Run training
const result = trainPerceptron()

// Format output
let output = ''
output += '='.repeat(100) + '\n'
output += 'PERCEPTRON TRAINING DEBUG OUTPUT\n'
output += '='.repeat(100) + '\n\n'

output += `CONVERGENCE: ${result.converged}\n`
output += `EPOCHS NEEDED: ${result.epochsNeeded}\n`
output += `FINAL WEIGHTS: w0=${result.finalWeights.w0.toFixed(3)}, w1=${result.finalWeights.w1.toFixed(3)}, w2=${result.finalWeights.w2.toFixed(3)}\n\n`

output += `TOTAL ITERATIONS: ${result.iterations.length}\n\n`

output += '-'.repeat(100) + '\n'
output += 'ITERATION DETAILS:\n'
output += '-'.repeat(100) + '\n\n'

result.iterations.forEach((iter, idx) => {
    output += `ITERATION ${idx + 1}:\n`
    output += `  Epoch: ${iter.epoch}\n`
    output += `  Point Index: ${iter.pointIndex}\n`
    output += `  Day: ${iter.pointDay}\n`
    output += `  Normalized Money: ${iter.normalizedMoney.toFixed(3)}\n`
    output += `  Normalized Wait: ${iter.normalizedWaitTime.toFixed(3)}\n`
    output += `  Decision Label: ${iter.decision === 1 ? '+1 (BRT)' : '-1 (Danfo)'}\n`
    output += `  Dot Product: ${iter.dotProduct}\n`
    output += `  Correctly Classified: ${iter.isCorrect ? 'YES' : 'NO'}\n`
    output += `  Weight Before: w0=${iter.weightBefore.w0.toFixed(3)}, w1=${iter.weightBefore.w1.toFixed(3)}, w2=${iter.weightBefore.w2.toFixed(3)}\n`
    output += `  Weight After: w0=${iter.weightAfter.w0.toFixed(3)}, w1=${iter.weightAfter.w1.toFixed(3)}, w2=${iter.weightAfter.w2.toFixed(3)}\n`
    if (iter.weightChanged) {
        const dw0 = (iter.weightAfter.w0 - iter.weightBefore.w0).toFixed(3)
        const dw1 = (iter.weightAfter.w1 - iter.weightBefore.w1).toFixed(3)
        const dw2 = (iter.weightAfter.w2 - iter.weightBefore.w2).toFixed(3)
        output += `  Weight Delta: Δw0=${dw0}, Δw1=${dw1}, Δw2=${dw2}\n`
    }
    output += '\n'
})

output += '\n' + '='.repeat(100) + '\n'
output += 'SUMMARY BY EPOCH:\n'
output += '='.repeat(100) + '\n\n'

for (let e = 1; e <= result.epochsNeeded; e++) {
    const epochIters = result.iterations.filter(it => it.epoch === e)
    const misclassified = epochIters.filter(it => !it.isCorrect).length
    const correct = epochIters.filter(it => it.isCorrect).length

    output += `EPOCH ${e}:\n`
    output += `  Total iterations: ${epochIters.length}\n`
    output += `  Correct: ${correct}\n`
    output += `  Misclassified: ${misclassified}\n`
    output += `  Weights at end: w0=${epochIters[epochIters.length - 1].weightAfter.w0.toFixed(3)}, w1=${epochIters[epochIters.length - 1].weightAfter.w1.toFixed(3)}, w2=${epochIters[epochIters.length - 1].weightAfter.w2.toFixed(3)}\n\n`
}

// Write to file
const outputPath = path.join(__dirname, 'perceptron-debug-output.txt')
fs.writeFileSync(outputPath, output)

console.log(`Debug output written to: ${outputPath}`)
console.log(`\nQuick Summary:`)
console.log(`  Converged: ${result.converged}`)
console.log(`  Epochs: ${result.epochsNeeded}`)
console.log(`  Final Weights: w0=${result.finalWeights.w0.toFixed(3)}, w1=${result.finalWeights.w1.toFixed(3)}, w2=${result.finalWeights.w2.toFixed(3)}`)
console.log(`  Total Iterations: ${result.iterations.length}`)
