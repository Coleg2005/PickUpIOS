import { StyleSheet, Text, TouchableOpacity } from 'react-native';

import ParallaxScrollView from '@/components/ParallaxScrollView';

import { Collapsible } from '@/components/Collapsible';
import Card from '@/components/Card';

import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      >
      <Collapsible title="Games You Made">
        <TouchableOpacity onPress={() => router.push('./game')}>
          <Card title="this is an example">
            <Text>This is a custom card component in React Native.</Text>
          </Card>
        </TouchableOpacity>
      </Collapsible>
      <Collapsible title="Games You're In">
      
      </Collapsible>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  textInCard: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
});
