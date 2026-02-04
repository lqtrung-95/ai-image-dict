# Sound Effects Guide

This app supports sound effects to make learning more fun and engaging!

## Current Status

The sound system is set up and ready to use. It currently uses haptic feedback (vibrations) as a fallback when sound files are not available.

## Adding Sound Files

To enable actual sound effects, add MP3 files to:
```
apps/mobile/assets/sounds/
```

### Required Sound Files

| Filename | Used When | Suggested Source |
|----------|-----------|------------------|
| `button_click.mp3` | Pressing buttons | Short click sound |
| `card_flip.mp3` | Flipping flashcards | Paper flip sound |
| `correct.mp3` | Correct answer | Happy chime |
| `wrong.mp3` | Wrong answer | Low buzz/bloop |
| `success.mp3` | Achievement unlock | Victory fanfare |
| `complete.mp3` | Session complete | Success melody |
| `match.mp3` | Matching cards | Pop sound |
| `streak.mp3` | Streak milestone | Rising tone |
| `level_up.mp3` | Level up | Epic fanfare |
| `coin.mp3` | Earning points | Coin drop |
| `pop.mp3` | Small interactions | Bubble pop |
| `whoosh.mp3` | Screen transitions | Air whoosh |

### Free Sound Resources

1. **Freesound.org** - https://freesound.org
   - Free with attribution
   - Filter by "Creative Commons 0" for no attribution

2. **Zapsplat** - https://www.zapsplat.com
   - Free with account
   - High quality game sounds

3. **Mixkit** - https://mixkit.co/free-sound-effects/
   - Completely free
   - No attribution required

### Sound Guidelines

- **Keep it short**: Sounds should be under 1 second (except completion sounds)
- **Keep it quiet**: Sounds are played at 20-40% volume by default
- **Make it subtle**: Sounds should enhance, not distract
- **Test on device**: Some sounds feel different on phone speakers

### Technical Details

- Format: MP3 (recommended) or WAV
- Sample rate: 44.1kHz
- Bitrate: 128kbps is sufficient
- Volume: The app automatically adjusts volume levels

## Sound Toggle

Users can enable/disable sounds in Settings > App Preferences > Sound Effects

The setting is stored in memory and resets on app restart. To persist the setting, you could use AsyncStorage.

## Troubleshooting

**Sounds not playing?**
- Check that the MP3 files exist in `assets/sounds/`
- Check phone is not on silent mode
- Check app has audio permissions
- Check volume is up

**Sounds too loud/quiet?**
- Adjust the volume in `lib/sound-effects-manager.ts`
- Look for the `SOUND_VOLUMES` constant
