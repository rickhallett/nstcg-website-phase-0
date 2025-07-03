describe('Test Setup Verification', () => {
  it('should run a basic test', () => {
    expect(true).toBe(true);
  });

  it('should have environment configured', () => {
    const testEnv = process.env.NODE_ENV || 'test';
    expect(testEnv).toBe('test');
  });

  it('should be able to use TypeScript features', () => {
    const testFunction = (name: string): string => {
      return `Hello, ${name}!`;
    };
    expect(testFunction('Test')).toBe('Hello, Test!');
  });
});