import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { userFeedbackService } from '@/lib/feedback/user-feedback';
import { Star, ThumbsUp, ThumbsDown, MessageSquare, X } from 'lucide-react';

interface FeedbackWidgetProps {
  feature: string;
  onClose?: () => void;
  className?: string;
}

export const FeedbackWidget = ({ feature, onClose, className = '' }: FeedbackWidgetProps) => {
  const { toast } = useToast();
  const [rating, setRating] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!rating) {
      toast({
        title: "Rating Required",
        description: "Please select a rating before submitting feedback.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await userFeedbackService.submitFeedback(
        feature,
        rating,
        feedback.trim() || undefined
      );

      if (result.success) {
        setIsSubmitted(true);
        toast({
          title: "Thank you!",
          description: "Your feedback has been submitted successfully.",
        });
        
        // Auto-close after 2 seconds
        setTimeout(() => {
          onClose?.();
        }, 2000);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to submit feedback. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <Card className={`w-full max-w-md ${className}`}>
        <CardContent className="p-6 text-center">
          <div className="text-green-500 mb-2">
            <ThumbsUp className="h-8 w-8 mx-auto" />
          </div>
          <h3 className="font-semibold text-lg mb-2">Thank you!</h3>
          <p className="text-muted-foreground">
            Your feedback helps us improve {feature}.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`w-full max-w-md ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Rate {feature}</CardTitle>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          How was your experience with this feature?
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Rating Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Rating</label>
          <div className="flex items-center space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Button
                key={star}
                variant={rating === star ? "default" : "outline"}
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setRating(star)}
              >
                <Star
                  className={`h-4 w-4 ${
                    rating && rating >= star ? "fill-current" : ""
                  }`}
                />
              </Button>
            ))}
            {rating && (
              <span className="text-sm text-muted-foreground ml-2">
                {rating === 1 && "Poor"}
                {rating === 2 && "Fair"}
                {rating === 3 && "Good"}
                {rating === 4 && "Very Good"}
                {rating === 5 && "Excellent"}
              </span>
            )}
          </div>
        </div>

        {/* Feedback Text */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Additional Feedback (Optional)</label>
          <Textarea
            placeholder="Tell us more about your experience..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="min-h-20"
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground text-right">
            {feedback.length}/500 characters
          </p>
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={!rating || isSubmitting}
          className="w-full"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Submitting...
            </>
          ) : (
            <>
              <MessageSquare className="h-4 w-4 mr-2" />
              Submit Feedback
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

// Quick feedback component for inline use
interface QuickFeedbackProps {
  feature: string;
  onFeedback?: (rating: number) => void;
  className?: string;
}

export const QuickFeedback = ({ feature, onFeedback, className = '' }: QuickFeedbackProps) => {
  const [rating, setRating] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleRating = async (selectedRating: number) => {
    setRating(selectedRating);
    setIsSubmitted(true);
    
    try {
      await userFeedbackService.submitFeedback(feature, selectedRating);
      onFeedback?.(selectedRating);
    } catch (error) {
      console.error('Error submitting quick feedback:', error);
    }
  };

  if (isSubmitted) {
    return (
      <div className={`flex items-center space-x-1 text-green-600 ${className}`}>
        <ThumbsUp className="h-4 w-4" />
        <span className="text-sm">Thank you!</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <span className="text-sm text-muted-foreground mr-2">Was this helpful?</span>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0"
        onClick={() => handleRating(5)}
      >
        <ThumbsUp className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0"
        onClick={() => handleRating(1)}
      >
        <ThumbsDown className="h-4 w-4" />
      </Button>
    </div>
  );
};
