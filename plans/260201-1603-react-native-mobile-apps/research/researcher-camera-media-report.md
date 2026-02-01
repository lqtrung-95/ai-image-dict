# Camera & Media Handling in Expo React Native

## Summary

For an AI photo analysis app, use **expo-image-picker** for quick capture/selection and **expo-camera** only if you need a custom camera UI. The current Capacitor implementation (`@capacitor/camera`) already provides similar functionality to expo-image-picker.

---

## 1. expo-camera vs expo-image-picker

| Feature | expo-camera | expo-image-picker |
|---------|-------------|-------------------|
| **UI** | Custom React component | Native system UI |
| **Use case** | Custom camera experience | Quick capture/selection |
| **Preview** | Live camera preview | No preview (native) |
| **Control** | Full (zoom, flash, torch) | Limited |
| **Complexity** | Higher | Lower |
| **Permissions** | Manual handling | Automatic |
| **Bundle size** | Larger | Smaller |

**Recommendation**: Use `expo-image-picker` for AI photo analysis apps. It is simpler, handles permissions automatically, and uses the familiar native camera UI users expect.

---

## 2. Image Compression & Optimization

Use `expo-image-manipulator` to resize/compress before upload:

```typescript
import * as ImageManipulator from 'expo-image-manipulator';

async function compressImage(uri: string, maxSize: number = 1024): Promise<string> {
  const manipulated = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: maxSize } }],
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
  );
  return manipulated.uri;
}
```

**Best practices**:
- Resize to 1024px max dimension before AI analysis
- Use JPEG at 0.8 quality for good size/quality balance
- Process in cache directory, move to documents only if saving

---

## 3. Base64 Encoding for API Uploads

```typescript
import * as FileSystem from 'expo-file-system';

async function imageToBase64(uri: string): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return `data:image/jpeg;base64,${base64}`;
}
```

**Note**: For large images, upload as multipart/form-data instead of base64 to avoid memory issues.

---

## 4. Photo Gallery Integration & Permissions

```typescript
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';

// Request permissions
const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
if (status !== 'granted') {
  alert('Permission required to access photos');
}

// Launch image picker
const result = await ImagePicker.launchImageLibraryAsync({
  mediaTypes: ImagePicker.MediaTypeOptions.Images,
  allowsEditing: true,
  quality: 0.9,
  allowsMultipleSelection: false,
});

if (!result.canceled) {
  const uri = result.assets[0].uri;
  // Process image
}
```

**Required permissions** (add to app.json):
```json
{
  "expo": {
    "plugins": [
      [
        "expo-image-picker",
        {
          "photosPermission": "Allow access to photos for vocabulary learning"
        }
      ]
    ]
  }
}
```

---

## 5. File Upload to APIs

### Using FormData (recommended for large files):

```typescript
async function uploadImage(uri: string, apiUrl: string): Promise<void> {
  const formData = new FormData();

  formData.append('image', {
    uri,
    name: 'photo.jpg',
    type: 'image/jpeg',
  } as any);

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Upload failed');
  }

  return response.json();
}
```

### Using base64 (for AI APIs like Groq):

```typescript
async function analyzeWithAI(base64Image: string): Promise<AnalysisResult> {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: base64Image }),
  });
  return response.json();
}
```

---

## 6. Preview & Cropping

```typescript
const result = await ImagePicker.launchImageLibraryAsync({
  allowsEditing: true,
  aspect: [4, 3], // Crop aspect ratio
  quality: 1,
});
```

**Limitations**:
- iOS: crop only (no rotate)
- Android: crop + rotate
- Multiple selection disables editing

For advanced cropping, use `expo-image-manipulator` or `react-native-image-crop-picker`.

---

## 7. Storage Strategy

```typescript
import * as FileSystem from 'expo-file-system';

// Storage paths
const CACHE_DIR = FileSystem.cacheDirectory + 'images/';
const DOC_DIR = FileSystem.documentDirectory + 'images/';

// Save captured photo temporarily
async function saveTempImage(sourceUri: string): Promise<string> {
  await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
  const filename = Date.now() + '.jpg';
  const destUri = CACHE_DIR + filename;
  await FileSystem.copyAsync({ from: sourceUri, to: destUri });
  return destUri;
}

// Persist important photos
async function persistImage(cacheUri: string): Promise<string> {
  await FileSystem.makeDirectoryAsync(DOC_DIR, { intermediates: true });
  const filename = cacheUri.split('/').pop();
  const destUri = DOC_DIR + filename;
  await FileSystem.moveAsync({ from: cacheUri, to: destUri });
  return destUri;
}

// Clean up cache periodically
async function clearImageCache(): Promise<void> {
  const files = await FileSystem.readDirectoryAsync(CACHE_DIR);
  for (const file of files) {
    await FileSystem.deleteAsync(CACHE_DIR + file);
  }
}
```

**Storage Guidelines**:
| Location | Use Case | Persistence |
|----------|----------|-------------|
| `cacheDirectory` | Processing, temporary files | System may delete |
| `documentDirectory` | User-saved photos, important images | Persistent |

---

## Migration from Capacitor Camera

Current implementation uses `@capacitor/camera`. To migrate to Expo:

| Capacitor | Expo Equivalent |
|-----------|-----------------|
| `Camera.getPhoto()` | `ImagePicker.launchCameraAsync()` |
| `CameraSource.Camera` | `launchCameraAsync()` |
| `CameraSource.Photos` | `launchImageLibraryAsync()` |
| `CameraResultType.Base64` | `base64: true` option |
| `CameraResultType.Uri` | Default behavior |

---

## Unresolved Questions

1. Should we keep Capacitor Camera or migrate to Expo Camera when fully ejecting?
2. What is the maximum image size the Groq API accepts for base64 uploads?
3. Do we need to support offline photo capture with deferred upload?
