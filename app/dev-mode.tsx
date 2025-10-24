import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DevModeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Dev Mode</Text>
        <Text style={styles.subtitle}>Development interface coming soon...</Text>

        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            This will be a development interface with the same chat UI but no functionality for now.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#ccc',
    marginBottom: 30,
    textAlign: 'center',
  },
  placeholder: {
    backgroundColor: '#333',
    padding: 20,
    borderRadius: 8,
    maxWidth: 300,
  },
  placeholderText: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});