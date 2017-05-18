import { Component } from '@angular/core';

@Component({
  selector: 'hello-world',
  templateUrl: './hello-world.component.html'
})
export class HelloWorldComponent {
  public sayHello(): void {
    console.log('Hello World');
  }
}
