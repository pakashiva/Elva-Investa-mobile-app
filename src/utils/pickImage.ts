import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

export type PickedImage = {
  uri: string;
  fileName: string;
};

export async function pickDocumentImage(): Promise<PickedImage | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert(
      'Permission required',
      'Please allow photo library access to upload KYC documents.'
    );
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    quality: 0.85,
  });

  if (result.canceled || !result.assets?.[0]) {
    return null;
  }

  const asset = result.assets[0];
  const fileName =
    asset.fileName ?? asset.uri.split('/').pop() ?? 'document.jpg';

  return {
    uri: asset.uri,
    fileName,
  };
}
