export type PipelineState = 'idle' | 'validating' | 'resolving' | 'building' | 'success' | 'error'

export const pipelineStates: PipelineState[] = ['idle', 'validating', 'resolving', 'building', 'success', 'error']

export function getNextPipelineState(currentState: PipelineState): PipelineState {
  const currentIndex = pipelineStates.indexOf(currentState)
  return pipelineStates[(currentIndex + 1) % pipelineStates.length]
}

export function getPipelineStatusMessage(state: PipelineState, proxyBaseUrl: string) {
  if (state === 'idle') return 'Ready to validate and convert your decklist.'
  if (state === 'validating') return 'Mock: validating decklist format and quantities.'
  if (state === 'resolving') return 'Mock: resolving cards against Scryfall.'
  if (state === 'building') return 'Mock: assembling TTS ObjectStates payload.'
  if (state === 'success') return 'Mock: conversion complete. JSON download will be enabled in a later step.'
  return proxyBaseUrl
    ? `Mock: conversion failed while targeting ${proxyBaseUrl}. This is a placeholder error state for UI review.`
    : 'Mock: conversion failed. This is a placeholder error state for UI review.'
}