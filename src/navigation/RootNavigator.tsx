import { NavigationContainer } from '@react-navigation/native';
import { HomeScreen } from '../screens';

export function RootNavigator() {
  return (
    <NavigationContainer>
      <HomeScreen />
    </NavigationContainer>
  );
}
